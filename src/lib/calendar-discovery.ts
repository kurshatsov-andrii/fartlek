import { detectCity } from "@/lib/start-filters";

export type CalendarScope = "ukraine" | "kharkiv";
export interface CalendarRow {
  id: string; source: "platform" | "calendar"; title: string; event_date: string;
  location: string | null; distances: string; organizer_name: string | null;
  category: string | null; url: string | null; notes?: string | null; created_by?: string | null;
  registration_status?: string | null; registration_opens_on?: string | null; info_source_url?: string | null; info_checked_on?: string | null;
}
export const matchesCalendarScope = (location: string | null, scope: CalendarScope, notes?: string | null) =>
  scope === "ukraine" || detectCity(location) === "Харків" ||
  Boolean(notes?.startsWith('Джерело: афіша «Календар стартів Харкова 2027»'));
export const calendarDistance = (distance: string | null | undefined, locale: string) =>
  distance?.trim() || (locale === "uk" ? "Не зазначено" : "Not specified");
export const calendarDate = (iso: string, locale: string, monthOnly = false) =>
  new Date(`${iso.slice(0, monthOnly ? 7 : 10)}${monthOnly ? "-01" : ""}T12:00:00Z`).toLocaleDateString(locale, {
    timeZone: "Europe/Kyiv", month: "long", year: "numeric", ...(monthOnly ? {} : { day: "2-digit", weekday: "short" }),
  });
export const kyivToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());