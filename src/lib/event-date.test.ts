import { describe, it, expect } from "vitest";
import { isCompletedDate } from "./event-date";

// Owner rule: a start counts as finished from the day before its date.
describe("isCompletedDate", () => {
  const today = "2027-01-10";
  it("start day counts as finished", () => expect(isCompletedDate("2027-01-10", today)).toBe(true));
  it("day before the start counts as finished", () => expect(isCompletedDate("2027-01-11", today)).toBe(true));
  it("two days before the start is still upcoming", () => expect(isCompletedDate("2027-01-12", today)).toBe(false));
  it("past dates count as finished", () => expect(isCompletedDate("2027-01-01", today)).toBe(true));
  it("cutoff crosses month boundary", () => expect(isCompletedDate("2027-02-01", "2027-01-31")).toBe(true));
  it("missing date is never finished", () => expect(isCompletedDate(null, today)).toBe(false));
});
