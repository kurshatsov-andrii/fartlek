import { createServerFn } from "@tanstack/react-start";
import { calendarLocation } from "@/lib/calendar-location";
import { kyivToday, type CalendarRow } from "@/lib/calendar-discovery";

export const getPublicCalendar = createServerFn({ method: "GET" }).handler(async (): Promise<CalendarRow[]> => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Calendar unavailable");
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  } } });
  const today = kyivToday();
  const [events, calendar, starts] = await Promise.all([
    sb.from("events").select("id,slug,title,event_date,location,description,organizer_name,category,distances(distance_km,is_active)").eq("status", "published").gte("event_date", today).order("event_date").limit(1000),
    sb.from("calendar_events").select("id,title,event_date,location,distances,organizer_name,category,url,notes,created_by,telegram_start_id,registration_status,registration_opens_on,info_source_url,info_checked_on").gte("event_date", today).order("event_date").limit(1000),
    sb.from("telegram_starts").select("id,city,region,description").eq("status", "published").limit(1000),
  ]);
  if (events.error || calendar.error || starts.error) throw new Error("Calendar unavailable");
  const linked = new Map((starts.data ?? []).map((s) => [s.id, s]));
  return [
    ...(events.data ?? []).map((e): CalendarRow => ({ id: e.id, source: "platform", title: e.title, event_date: e.event_date, location: calendarLocation(e), distances: (e.distances ?? []).filter((d: { is_active: boolean }) => d.is_active !== false).map((d: { distance_km: number }) => `${d.distance_km} км`).join(", "), organizer_name: e.organizer_name, category: e.category, url: `/events/${e.slug ?? e.id}` })),
    ...(calendar.data ?? []).map((c): CalendarRow => ({ id: c.id, source: "calendar", title: c.title, event_date: c.event_date, location: calendarLocation({ location: c.location, description: c.notes, ...linked.get(c.telegram_start_id) }), distances: c.distances ?? "", organizer_name: c.organizer_name, category: c.category, url: c.url, notes: c.notes, created_by: c.created_by })),
  ];
});