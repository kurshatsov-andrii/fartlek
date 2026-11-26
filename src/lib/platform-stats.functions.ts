import { createServerFn } from "@tanstack/react-start";

export type PlatformStats = { events: number; runners: number; registrations: number; organizers: number; cities: number; clubs: number };

export const getPlatformStats = createServerFn({ method: "GET" }).handler(async (): Promise<PlatformStats | null> => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return null;
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } } });
    const { data, error } = await (sb.rpc as any)("get_public_stats");
    if (error) return null;
    const r = Array.isArray(data) ? data[0] : data;
    if (!r) return null;
    return { events: r.events_count ?? 0, runners: r.runners_count ?? 0, registrations: r.registrations_count ?? 0, organizers: r.organizers_count ?? 0, cities: r.cities_count ?? 0, clubs: r.clubs_count ?? 0 };
  } catch { return null; }
});
