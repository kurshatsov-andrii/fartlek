import { supabase } from "@/integrations/supabase/client";
import { buildIcs, type CalendarEvent } from "@/lib/calendar";
import { kyivToday } from "@/lib/calendar-discovery";
import {
  deriveRegistrationState,
  type RegistrationInfo,
} from "@/lib/registration-status";
export type StartSource = "event" | "start" | "calendar";
export interface StartRef {
  source: StartSource;
  id: string;
}
export interface PlannedStart extends StartRef {
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  distances: string;
  price: number | null;
  isPaid: boolean | null;
  organizer: string | null;
  url: string | null;
  image: string | null;
  registration: RegistrationInfo;
}
export const startKey = (r: StartRef) => `${r.source}:${r.id}`;
export const MAX_COMPARE = 3;
export function toggleComparison(
  items: StartRef[],
  item: StartRef,
): StartRef[] {
  if (items.some((r) => startKey(r) === startKey(item)))
    return items.filter((r) => startKey(r) !== startKey(item));
  return items.length < MAX_COMPARE ? [...items, item] : items;
}
export function reminderDue(
  date: string | null,
  days: number | null,
  today: string,
): boolean {
  if (!date || days === null) return false;
  const difference =
    (Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) /
    86400000;
  return difference >= 0 && difference <= days;
}
export interface ReminderPrefs {
  reminder_days: number | null;
  notify_registration: boolean;
  notify_date_change: boolean;
  known_date: string | null;
  known_registration: string | null;
}
export type PlannerAlertKind = "start" | "registration" | "date";
/** In-app alerts the user explicitly opted into for one saved start. */
export function plannerAlerts(
  s: Pick<PlannedStart, "date" | "registration">,
  prefs: ReminderPrefs | undefined,
  today: string,
): PlannerAlertKind[] {
  if (!prefs) return [];
  const alerts: PlannerAlertKind[] = [];
  if (
    prefs.notify_registration &&
    s.registration.state === "open" &&
    prefs.known_registration !== "open"
  )
    alerts.push("registration");
  if (
    prefs.notify_date_change &&
    prefs.known_date &&
    s.date &&
    s.date !== prefs.known_date
  )
    alerts.push("date");
  if (reminderDue(s.date, prefs.reminder_days, today)) alerts.push("start");
  return alerts;
}
export async function resolveStarts(refs: StartRef[]): Promise<PlannedStart[]> {
  const ids = (source: StartSource) =>
    refs.filter((r) => r.source === source).map((r) => r.id);
  const [events, starts, calendar] = await Promise.all([
    ids("event").length
      ? supabase
          .from("events")
          .select(
            "id,slug,title,event_date,event_time,location,image_url,is_paid,organizer_name,status,registration_closed,registration_opens_on,updated_at,distances(distance_km,price,is_active)",
          )
          .in("id", ids("event"))
          .in("status", ["published", "completed"])
      : Promise.resolve({ data: [], error: null }),
    ids("start").length
      ? supabase
          .from("telegram_starts")
          .select(
            "id,slug,title,event_date,city,distances_km,is_paid,organizer_name,image_url,register_url,registration_status,registration_opens_on,info_source_url,info_checked_on",
          )
          .in("id", ids("start"))
          .eq("status", "published")
      : Promise.resolve({ data: [], error: null }),
    ids("calendar").length
      ? supabase
          .from("calendar_events")
          .select("id,title,event_date,location,distances,organizer_name,url,registration_status,registration_opens_on,info_source_url,info_checked_on")
          .in("id", ids("calendar"))
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (events.error || starts.error || calendar.error)
    throw new Error("Не вдалося завантажити старти");
  const today = kyivToday();
  const result: PlannedStart[] = [];
  for (const e of events.data ?? []) {
    const ds = e.distances.filter((d) => d.is_active);
    result.push({
      source: "event",
      id: e.id,
      title: e.title,
      date: e.event_date,
      time: e.event_time,
      location: e.location,
      distances: ds.map((d) => `${d.distance_km} км`).join(", "),
      price: ds.length ? Math.min(...ds.map((d) => d.price)) : null,
      isPaid: e.is_paid,
      organizer: e.organizer_name,
      url: `/events/${e.slug ?? e.id}`,
      image: e.image_url,
      registration: {
        state: deriveRegistrationState({
          cancelled: e.status === "cancelled",
          closed: e.registration_closed || e.status === "completed",
          opensOn: e.registration_opens_on,
          defaultOpen: true,
          date: e.event_date,
          today,
        }),
        opensOn: e.registration_opens_on,
        sourceUrl: null,
        sourceLabel: "Організатор на Фартлек",
        checkedOn: e.updated_at.slice(0, 10),
      },
    });
  }
  for (const s of starts.data ?? [])
    result.push({
      source: "start",
      id: s.id,
      title: s.title,
      date: s.event_date,
      time: null,
      location: s.city,
      distances: s.distances_km.map((d) => `${d} км`).join(", "),
      price: null,
      isPaid: s.is_paid,
      organizer: s.organizer_name,
      url: `/starts/${s.slug}`,
      image: s.image_url,
      registration: {
        state: deriveRegistrationState({
          explicit: s.registration_status,
          opensOn: s.registration_opens_on,
          date: s.event_date,
          today,
        }),
        opensOn: s.registration_opens_on,
        sourceUrl: s.info_source_url ?? s.register_url,
        sourceLabel: null,
        checkedOn: s.info_checked_on,
      },
    });
  for (const c of calendar.data ?? [])
    result.push({
      source: "calendar",
      id: c.id,
      title: c.title,
      date: c.event_date,
      time: null,
      location: c.location,
      distances: c.distances ?? "",
      price: null,
      isPaid: null,
      organizer: c.organizer_name,
      url: c.url,
      image: null,
      registration: {
        state: deriveRegistrationState({
          explicit: c.registration_status,
          opensOn: c.registration_opens_on,
          date: c.event_date,
          today,
        }),
        opensOn: c.registration_opens_on,
        sourceUrl: c.info_source_url ?? c.url,
        sourceLabel: null,
        checkedOn: c.info_checked_on,
      },
    });
  return refs.flatMap((r) => {
    const item = result.find((i) => startKey(i) === startKey(r));
    return item ? [item] : [];
  });
}
export function plannerCalendarEvent(
  s: PlannedStart,
  days: number | null,
): CalendarEvent | null {
  if (!s.date) return null;
  return {
    uid: startKey(s),
    title: s.title,
    date: s.date,
    time: s.time ?? "",
    allDay: !s.time,
    location: s.location,
    description: s.distances,
    url: s.url ? new URL(s.url, "https://fartlek.com.ua").href : undefined,
    reminderDays: days,
  };
}
export function downloadPlannedCalendar(s: PlannedStart, days: number | null) {
  const event = plannerCalendarEvent(s, days);
  if (!event) return;
  const url = URL.createObjectURL(
    new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `fartlek-${s.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
