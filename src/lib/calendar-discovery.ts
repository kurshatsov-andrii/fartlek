import { detectCity } from "@/lib/start-filters";

export type CalendarScope = "ukraine" | "kharkiv";
export interface CalendarRow {
  id: string; source: "platform" | "calendar"; title: string; event_date: string;
  location: string | null; distances: string; organizer_name: string | null;
  category: string | null; url: string | null; notes?: string | null; created_by?: string | null;
}
export const matchesCalendarScope = (location: string | null, scope: CalendarScope) => scope === "ukraine" || detectCity(location) === "Харків";
export const calendarDate = (iso: string, locale: string, monthOnly = false) =>
  new Date(`${iso.slice(0, monthOnly ? 7 : 10)}${monthOnly ? "-01" : ""}T12:00:00Z`).toLocaleDateString(locale, {
    timeZone: "Europe/Kyiv", month: "long", year: "numeric", ...(monthOnly ? {} : { day: "2-digit", weekday: "short" }),
  });
export const kyivToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());