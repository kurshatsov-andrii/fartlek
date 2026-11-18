import { describe, expect, it } from "vitest";
import { findCityCoords } from "./uaCities";

describe("findCityCoords", () => {
  it("places Pivdenne in Odesa Oblast near Odesa, not Kharkiv", () => {
    expect(findCityCoords("Південне", "Одеська область")).toEqual([46.62, 31.1]);
  });

  it("keeps the existing default for records without a region", () => {
    expect(findCityCoords("Південне")).toEqual([49.883, 36.017]);
  });
});
