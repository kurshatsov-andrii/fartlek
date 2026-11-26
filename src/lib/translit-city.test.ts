import { describe, it, expect } from "vitest";
import { translitCity } from "./translit-city";
describe("translitCity", () => {
  it("transliterates cities", () => {
    expect(translitCity("Харків")).toBe("Kharkiv");
    expect(translitCity("Івано-Франківськ")).toBe("Ivano-Frankivsk");
    expect(translitCity("Кам'янець-Подільський")).toBe("Kamianets-Podilskyi");
    expect(translitCity("Ужгород")).toBe("Uzhhorod");
  });
});
