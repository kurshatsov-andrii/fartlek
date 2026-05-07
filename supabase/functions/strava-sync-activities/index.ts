import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
}

async function refreshIfNeeded(admin: any, conn: any, clientId: string, clientSecret: string) {
  const expiresAt = new Date(conn.expires_at).getTime();
  if (expiresAt - Date.now() > 5 * 60 * 1000) return conn;
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error("Strava refresh failed: " + JSON.stringify(data));
  await admin
    .from("strava_connections")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(data.expires_at * 1000).toISOString(),
    })
    .eq("user_id", conn.user_id);
  return { ...conn, access_token: data.access_token, refresh_token: data.refresh_token };
}

async function fetchActivities(conn: any, after: number, before: number): Promise<StravaActivity[]> {
  const acts: StravaActivity[] = [];
  let page = 1;
  while (page <= 5) {
    const url = `https://www.strava.com/api/v3/athlete/activities?after=${after}&before=${before}&per_page=100&page=${page}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${conn.access_token}` } });
    if (!r.ok) throw new Error("Strava activities fetch failed: " + (await r.text()));
    const batch: StravaActivity[] = await r.json();
    acts.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return acts;
}

const parseHM = (v: string | null | undefined): [number, number] | null => {
  if (!v) return null;
  const [h, m] = v.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return [h, m];
};

function matchAndUpsertReg(
  admin: any,
  reg: any,
  acts: StravaActivity[],
  ownerUserId: string,
) {
  const d = reg.distances;
  const targetMeters = Number(d.distance_km) * 1000;
  const tol = Number(d.distance_tolerance_percent ?? 5) / 100;
  const minM = targetMeters * (1 - tol);
  const maxM = targetMeters * (1 + tol);
  const startDate = d.virtual_start_date ? new Date(d.virtual_start_date) : new Date(reg.events.event_date);
  const endDate = d.virtual_end_date ? new Date(d.virtual_end_date) : new Date(reg.events.event_date);
  endDate.setHours(23, 59, 59, 999);
  const tStart = parseHM(d.virtual_start_time);
  const tEnd = parseHM(d.virtual_end_time);

  const candidates = acts
    .filter((a) => {
      const dt = new Date(a.start_date);
      const t = dt.getTime();
      if (t < startDate.getTime() || t > endDate.getTime()) return false;
      if (tStart || tEnd) {
        const minutes = dt.getHours() * 60 + dt.getMinutes();
        if (tStart && minutes < tStart[0] * 60 + tStart[1]) return false;
        if (tEnd && minutes > tEnd[0] * 60 + tEnd[1]) return false;
      }
      if (a.distance < minM || a.distance > maxM) return false;
      const sport = (a.sport_type || a.type || "").toLowerCase();
      return sport.includes("run") || sport.includes("walk") || sport.includes("ride") || sport.includes("trail");
    })
    .sort((a, b) => {
      const da = Math.abs(a.distance - targetMeters);
      const db = Math.abs(b.distance - targetMeters);
      if (da !== db) return da - db;
      return a.moving_time - b.moving_time;
    });

  const best = candidates[0];
  if (!best) return null;
  return admin.from("event_results").upsert(
    {
      registration_id: reg.id,
      event_id: reg.event_id,
      distance_id: reg.distance_id,
      user_id: ownerUserId,
      time_seconds: best.moving_time || best.elapsed_time,
      moving_time_seconds: best.moving_time,
      distance_meters: Math.round(best.distance),
      source: "strava",
      strava_activity_id: best.id,
      activity_start_date: best.start_date,
      verified: true,
    },
    { onConflict: "registration_id" },
  ).then((res: any) => (res?.error ? null : best));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("STRAVA_CLIENT_ID")!;
    const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u, error: ue } = await userClient.auth.getUser();
    if (ue || !u.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = u.user.id;

    const body = await req.json().catch(() => ({}));
    const eventId = body?.event_id as string | undefined;
    const allUsers = !!body?.all_users;

    const admin = createClient(supabaseUrl, serviceKey);

    // Authorize organizer mode
    if (allUsers) {
      if (!eventId) {
        return new Response(JSON.stringify({ error: "event_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: canManage } = await admin.rpc("can_manage_event", {
        _event_id: eventId, _user_id: userId,
      });
      if (!canManage) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Load relevant registrations
    let regsQ = admin
      .from("registrations")
      .select("id, event_id, distance_id, user_id, distances:distance_id(distance_km, is_virtual, virtual_start_date, virtual_end_date, virtual_start_time, virtual_end_time, distance_tolerance_percent), events:event_id(event_date)");
    if (!allUsers) regsQ = regsQ.eq("user_id", userId);
    if (eventId) regsQ = regsQ.eq("event_id", eventId);
    const { data: regs, error: re } = await regsQ;
    if (re) throw re;

    const virtualRegs = (regs ?? []).filter((r: any) => r.distances?.is_virtual);
    if (virtualRegs.length === 0) {
      return new Response(JSON.stringify({ matched: 0, message: "No virtual registrations" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by user
    const byUser = new Map<string, any[]>();
    for (const r of virtualRegs as any[]) {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r);
      byUser.set(r.user_id, arr);
    }

    let matched = 0;
    const details: any[] = [];
    let skippedNoStrava = 0;

    for (const [uid, userRegs] of byUser.entries()) {
      const { data: connRow } = await admin
        .from("strava_connections").select("*").eq("user_id", uid).maybeSingle();
      if (!connRow) { skippedNoStrava++; continue; }
      let conn: any;
      try {
        conn = await refreshIfNeeded(admin, connRow, clientId, clientSecret);
      } catch (_e) { skippedNoStrava++; continue; }

      // window for this user
      let minDate = new Date();
      let maxDate = new Date(0);
      for (const r of userRegs) {
        const d = r.distances;
        const start = d.virtual_start_date ? new Date(d.virtual_start_date) : new Date(r.events.event_date);
        const end = d.virtual_end_date ? new Date(d.virtual_end_date) : new Date(r.events.event_date);
        if (start < minDate) minDate = start;
        if (end > maxDate) maxDate = end;
      }
      const after = Math.floor(minDate.getTime() / 1000);
      const before = Math.floor((maxDate.getTime() + 24 * 3600 * 1000) / 1000);

      let acts: StravaActivity[] = [];
      try {
        acts = await fetchActivities(conn, after, before);
      } catch (e) {
        console.error("fetch failed for user", uid, e);
        continue;
      }

      for (const reg of userRegs) {
        const best = await matchAndUpsertReg(admin, reg, acts, uid);
        if (best) {
          matched++;
          details.push({ registration_id: reg.id, user_id: uid, activity_id: best.id });
        }
      }
    }

    return new Response(JSON.stringify({
      matched, total_virtual: virtualRegs.length, skipped_no_strava: skippedNoStrava, details,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
