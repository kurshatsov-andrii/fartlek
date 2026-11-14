import { describe, expect, it } from "vitest";
import { availableYearMonths, matchesYearMonth } from "./start-filters";

describe("Starts month selection", () => {
  it("offers only populated month-year pairs in chronological order", () => {
    expect(availableYearMonths(["2027-01-01", "2026-12-06", "2026-11-15", "2026-12-19", null]))
      .toEqual(["2026-11", "2026-12", "2027-01"]);
  });
  it("limits months to the selected year", () => {
    expect(availableYearMonths(["2026-12-06", "2027-01-01"], "2027")).toEqual(["2027-01"]);
  });
  it("selects the month and year together rather than the same month in every year", () => {
    expect(matchesYearMonth("2026-12-06", "2026-12")).toBe(true);
    expect(matchesYearMonth("2027-12-06", "2026-12")).toBe(false);
    expect(matchesYearMonth(null, "2026-12")).toBe(false);
    expect(matchesYearMonth(null, "all")).toBe(true);
  });
});