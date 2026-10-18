import { describe, expect, it } from "vitest";
import { calendarDate, calendarDistance, matchesCalendarScope } from "./calendar-discovery";

describe("calendar discovery", () => {
  it("does not turn an unknown distance into a free-distance race", () => {
    expect(calendarDistance(null, "uk")).toBe("Не зазначено");
    expect(calendarDistance("21,1 км", "uk")).toBe("21,1 км");
  });
  it("includes Kharkiv venues in the city calendar", () => expect(matchesCalendarScope("Харків, Саржин Яр", "kharkiv")).toBe(true));
  it("excludes other cities from Kharkiv", () => expect(matchesCalendarScope("Вінниця, Центральний парк", "kharkiv")).toBe(false));
  it("does not invent a city for missing locations", () => expect(matchesCalendarScope(null, "kharkiv")).toBe(false));
  it("includes the poster's Bishkin Trail without inventing Kharkiv as its venue", () => {
    expect(matchesCalendarScope("Бішкін", "kharkiv", 'Джерело: афіша «Календар стартів Харкова 2027» на сторінці https://fartlek.com.ua/calendar/kharkiv.')).toBe(true);
    expect(matchesCalendarScope("Бішкін", "kharkiv")).toBe(false);
  });
  it("preserves the VINNYTSIA RUN May 23 2027 date", () => expect(calendarDate("2027-05-23", "en-US")).toContain("May 23, 2027"));
  it("preserves the September 5 2027 date", () => expect(calendarDate("2027-09-05", "en-US")).toContain("September 05, 2027"));
  it("includes Vinnytsia venues in the Vinnytsia calendar", () => {
    expect(matchesCalendarScope("Вінниця, Центральний парк", "vinnytsia")).toBe(true);
  });
  it("excludes other cities and Kharkiv season posters from Vinnytsia", () => {
    expect(matchesCalendarScope("Харків, Саржин Яр", "vinnytsia")).toBe(false);
    expect(matchesCalendarScope("Бішкін", "vinnytsia", 'Джерело: афіша «Календар стартів Харкова 2027»')).toBe(false);
    expect(matchesCalendarScope(null, "vinnytsia")).toBe(false);
  });
});