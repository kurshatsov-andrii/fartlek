import { describe, expect, it } from "vitest";
import { isPastDate } from "./event-date";

describe("isPastDate", () => {
  it("hides registration for a race that already ran", () => {
    expect(isPastDate("2026-10-11", "2026-10-15")).toBe(true);
  });

  it("keeps registration open on race day", () => {
    expect(isPastDate("2026-10-15", "2026-10-15")).toBe(false);
  });

  it("keeps registration open for a future race", () => {
    expect(isPastDate("2026-11-21", "2026-10-15")).toBe(false);
  });

  it("treats a missing date as not past", () => {
    expect(isPastDate(null, "2026-10-15")).toBe(false);
    expect(isPastDate(undefined, "2026-10-15")).toBe(false);
    expect(isPastDate("", "2026-10-15")).toBe(false);
  });
});
