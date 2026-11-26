import { createServerFn } from "@tanstack/react-start";

export type PlatformStats = { events: number; runners: number; registrations: number; organizers: number; cities: number; clubs: number };

export type GrowthPoint = { month: string; runners: number; registrations: number; events: number };
export type PlatformData = { stats: PlatformStats | null; growth: GrowthPoint[] };

export const getPlatformStats = createServerFn({ method: "GET" }).handler(async (): Promise<PlatformData> => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return { stats: null, growth: [] };
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } } });
    const [{ data, error }, g] = await Promise.all([(sb.rpc as any)("get_public_stats"), (sb.rpc as any)("get_public_growth")]);
    const growth: GrowthPoint[] = (g.data ?? []).map((x: any) => ({ month: String(x.month), runners: x.runners ?? 0, registrations: x.registrations ?? 0, events: x.events ?? 0 }));
    const r = !error ? (Array.isArray(data) ? data[0] : data) : null;
    if (!r) return { stats: null, growth };
    const stats: PlatformStats = { events: r.events_count ?? 0, runners: r.runners_count ?? 0, registrations: r.registrations_count ?? 0, organizers: r.organizers_count ?? 0, cities: r.cities_count ?? 0, clubs: r.clubs_count ?? 0 };
    if (growth.length) { const last = growth[growth.length - 1]!; last.runners = stats.runners; last.registrations = stats.registrations; last.events = stats.events; }
    return { stats, growth };
  } catch { return { stats: null, growth: [] }; }
});
