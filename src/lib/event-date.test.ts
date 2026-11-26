import { describe, it, expect } from "vitest";
import { isCompletedDate, isEventCompleted } from "./event-date";

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

// Owner override: a start with a future "registration open until" date stays upcoming.
describe("isEventCompleted", () => {
  const today = "2027-01-10";
  it("keeps a past start upcoming while the override date has not passed", () =>
    expect(isEventCompleted("2026-11-23", "2026-12-11", "2026-11-26")).toBe(false));
  it("marks a past start finished once the override date has passed", () =>
    expect(isEventCompleted("2026-11-23", "2026-11-25", "2026-11-26")).toBe(true));
  it("marks a past start finished without an override", () =>
    expect(isEventCompleted("2026-11-23", null, "2026-11-26")).toBe(true));
  it("keeps the day-before cutoff without an override", () =>
    expect(isEventCompleted("2027-01-11", null, today)).toBe(true));
  it("keeps the day before the start upcoming with an override", () =>
    expect(isEventCompleted("2027-01-11", "2027-01-11", today)).toBe(false));
  it("missing date is never finished", () => expect(isEventCompleted(null, null, today)).toBe(false));
});
