import { describe, expect, it } from "vitest";
import { calendarDate, matchesCalendarScope } from "./calendar-discovery";

describe("calendar discovery", () => {
  it("includes Kharkiv venues in the city calendar", () => expect(matchesCalendarScope("Харків, Саржин Яр", "kharkiv")).toBe(true));
  it("excludes other cities from Kharkiv", () => expect(matchesCalendarScope("Вінниця, Центральний парк", "kharkiv")).toBe(false));
  it("does not invent a city for missing locations", () => expect(matchesCalendarScope(null, "kharkiv")).toBe(false));
  it("preserves the VINNYTSIA RUN May 23 2027 date", () => expect(calendarDate("2027-05-23", "en-US")).toContain("May 23, 2027"));
  it("preserves the September 5 2027 date", () => expect(calendarDate("2027-09-05", "en-US")).toContain("September 05, 2027"));
});