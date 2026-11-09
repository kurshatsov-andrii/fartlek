import { detectCity } from "@/lib/start-filters";

export type CalendarScope = "ukraine" | "kharkiv" | "vinnytsia" | "uzhhorod" | "drohobych" | "lviv" | "varash" | "ivano-frankivsk" | "kyiv" | "zhytomyr" | "odesa" | "pustomyty" | "khust";
export const CITY_CALENDARS: { scope: Exclude<CalendarScope, "ukraine">; uk: string; ukGen: string; en: string }[] = [
  { scope: "kharkiv", uk: "Харків", ukGen: "Харкова", en: "Kharkiv" },
  { scope: "kyiv", uk: "Київ", ukGen: "Києва", en: "Kyiv" },
  { scope: "vinnytsia", uk: "Вінниця", ukGen: "Вінниці", en: "Vinnytsia" },
  { scope: "uzhhorod", uk: "Ужгород", ukGen: "Ужгорода", en: "Uzhhorod" },
  { scope: "drohobych", uk: "Дрогобич", ukGen: "Дрогобича", en: "Drohobych" },
  { scope: "lviv", uk: "Львів", ukGen: "Львова", en: "Lviv" },
  { scope: "varash", uk: "Вараш", ukGen: "Вараша", en: "Varash" },
  { scope: "ivano-frankivsk", uk: "Івано-Франківськ", ukGen: "Івано-Франківська", en: "Ivano-Frankivsk" },
  { scope: "zhytomyr", uk: "Житомир", ukGen: "Житомира", en: "Zhytomyr" },
  { scope: "odesa", uk: "Одеса", ukGen: "Одеси", en: "Odesa" },
  { scope: "pustomyty", uk: "Пустомити", ukGen: "Пустомит", en: "Pustomyty" },
  { scope: "khust", uk: "Хуст", ukGen: "Хуста", en: "Khust" },
];
export interface CalendarRow {
  id: string; source: "platform" | "calendar"; title: string; event_date: string;
  location: string | null; distances: string; organizer_name: string | null;
  category: string | null; url: string | null; notes?: string | null; created_by?: string | null;
  registration_status?: string | null; registration_opens_on?: string | null; info_source_url?: string | null; info_checked_on?: string | null;
}
export const matchesCalendarScope = (location: string | null, scope: CalendarScope, notes?: string | null) => {
  if (scope === "ukraine") return true;
  if (scope === "kharkiv") return detectCity(location) === "Харків" ||
    Boolean(notes?.startsWith('Джерело: афіша «Календар стартів Харкова 2027»'));
  return detectCity(location) === CITY_CALENDARS.find((c) => c.scope === scope)!.uk;
};
export const calendarDistance = (distance: string | null | undefined, locale: string) =>
  distance?.trim() || (locale === "uk" ? "Не зазначено" : "Not specified");
export const calendarDate = (iso: string, locale: string, monthOnly = false) =>
  new Date(`${iso.slice(0, monthOnly ? 7 : 10)}${monthOnly ? "-01" : ""}T12:00:00Z`).toLocaleDateString(locale, {
    timeZone: "Europe/Kyiv", month: "long", year: "numeric", ...(monthOnly ? {} : { day: "2-digit", weekday: "short" }),
  });
export const kyivToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());