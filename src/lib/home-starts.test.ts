import { describe, expect, it } from "vitest";
import { availableStartCategories, matchesStartCategory, showEventResults } from "./home-starts";

describe("homepage discovery rules", () => {
  it("shows only populated marathon, ultra and trail categories from either catalog", () => {
    expect(availableStartCategories([{ category: "marathon" }], ["trail"]))
      .toEqual(["marathon", "trail"]);
    expect(availableStartCategories([], ["ultra"])).toEqual(["ultra"]);
    expect(availableStartCategories([], [])).toEqual([]);
  });
  it("hides the events block when a search has no event results", () => {
    expect(showEventResults(0, false)).toBe(false);
    expect(showEventResults(1, false)).toBe(true);
    expect(showEventResults(0, true)).toBe(true);
  });
  it("applies the same category selection to other starts", () => {
    expect(matchesStartCategory(["marathon", "run"], "marathon")).toBe(true);
    expect(matchesStartCategory(["trail"], "marathon")).toBe(false);
    expect(matchesStartCategory(null, "all")).toBe(true);
  });
});