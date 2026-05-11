import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ResultRow {
  bib?: number | string;
  registration_id?: string;
  distance_id?: string;
  distance_km?: number;
  time_seconds?: number;
  gun_time_seconds?: number;
  chip_time_seconds?: number;
  finish_position?: number;
  finished_at?: string;
  notes?: string;
}

const parseTime = (v: unknown): number | undefined => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  if (typeof v === "string") {
    const s = v.trim();
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    // hh:mm:ss or mm:ss(.ms)
    const parts = s.split(":");
    if (parts.length === 2 || parts.length === 3) {
      const nums = parts.map((p) => parseFloat(p));
      if (nums.some((n) => Number.isNaN(n))) return undefined;
      return Math.round(
        parts.length === 3
          ? nums[0] * 3600 + nums[1] * 60 + nums[2]
          : nums[0] * 60 + nums[1],
      );
    }
  }
  return undefined;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => null) as
      | { event_api_key?: string; event_id?: string; results?: ResultRow[] }
      | null;
    if (!body || !Array.isArray(body.results)) {
      return new Response(JSON.stringify({ error: "results[] is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.results.length === 0 || body.results.length > 5000) {
      return new Response(JSON.stringify({ error: "results must be 1..5000 items" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: either event API key OR a logged-in manager (organizer/co-organizer/admin)
    const apiKey = body.event_api_key ?? req.headers.get("x-api-key") ?? undefined;
    let eventId: string | null = null;

    if (apiKey) {
      const { data: ev, error: ee } = await admin
        .from("events").select("id").eq("results_api_key", apiKey).maybeSingle();
      if (ee) throw ee;
      if (!ev || (body.event_id && body.event_id !== ev.id)) {
        return new Response(JSON.stringify({ error: "Invalid API key" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      eventId = ev.id as string;
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !body.event_id) {
        return new Response(JSON.stringify({ error: "Provide event_api_key or Authorization + event_id" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: u, error: ue } = await userClient.auth.getUser();
      if (ue || !u.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: canManage } = await admin.rpc("can_manage_event", {
        _event_id: body.event_id, _user_id: u.user.id,
      });
      if (!canManage) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      eventId = body.event_id;
    }

    // Load registrations + distances for this event once
    const { data: regs, error: re } = await admin
      .from("registrations")
      .select("id, distance_id, user_id, bib_number")
      .eq("event_id", eventId);
    if (re) throw re;
    const byBib = new Map<number, any>();
    const byId = new Map<string, any>();
    for (const r of regs ?? []) {
      if (r.bib_number != null) byBib.set(Number(r.bib_number), r);
      byId.set(r.id, r);
    }

    const { data: dists } = await admin
      .from("distances").select("id, distance_km").eq("event_id", eventId);
    const distById = new Map<string, any>((dists ?? []).map((d: any) => [d.id, d]));

    const accepted: any[] = [];
    const errors: any[] = [];

    body.results.forEach((row, idx) => {
      let reg: any = null;
      if (row.registration_id) reg = byId.get(row.registration_id);
      else if (row.bib != null) reg = byBib.get(Number(row.bib));
      if (!reg) {
        errors.push({ index: idx, bib: row.bib, error: "REGISTRATION_NOT_FOUND" });
        return;
      }
      const chip = parseTime(row.chip_time_seconds);
      const gun = parseTime(row.gun_time_seconds);
      const t = parseTime(row.time_seconds) ?? chip ?? gun;
      if (!t || t <= 0) {
        errors.push({ index: idx, bib: row.bib, error: "TIME_REQUIRED" });
        return;
      }
      const dist = distById.get(reg.distance_id);
      const distMeters = row.distance_km != null
        ? Math.round(Number(row.distance_km) * 1000)
        : dist?.distance_km != null ? Math.round(Number(dist.distance_km) * 1000) : null;

      accepted.push({
        registration_id: reg.id,
        event_id: eventId,
        distance_id: reg.distance_id,
        user_id: reg.user_id,
        time_seconds: t,
        gun_time_seconds: gun ?? null,
        chip_time_seconds: chip ?? null,
        distance_meters: distMeters,
        finish_position: row.finish_position ?? null,
        finished_at: row.finished_at ?? null,
        notes: row.notes ?? null,
        source: "ingest_api",
        verified: true,
      });
    });

    let upserted = 0;
    if (accepted.length > 0) {
      const { error: ue, count } = await admin
        .from("event_results")
        .upsert(accepted, { onConflict: "registration_id", count: "exact" });
      if (ue) throw ue;
      upserted = count ?? accepted.length;
    }

    return new Response(JSON.stringify({
      event_id: eventId,
      received: body.results.length,
      upserted,
      errors,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("results-ingest error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
