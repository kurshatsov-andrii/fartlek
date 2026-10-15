import { describe, expect, it } from "vitest";
import { SIS_PARTNER } from "./sis-partner";

describe("SiS partner offer", () => {
  it("offers the agreed 5 percent discount", () => {
    expect(SIS_PARTNER.discountPercent).toBe(5);
  });
  it("uses the agreed fartlek promo code", () => {
    expect(SIS_PARTNER.promoCode).toBe("fartlek");
  });
  it("sends orders to the agreed partner link", () => {
    expect(SIS_PARTNER.url).toBe("https://sis.in.ua/?promo=fartlek");
  });
});