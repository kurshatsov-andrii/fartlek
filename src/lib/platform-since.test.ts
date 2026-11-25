import { describe, expect, it } from "vitest";
import {
  PLATFORM_SINCE_EN,
  PLATFORM_SINCE_ISO,
  PLATFORM_SINCE_UK,
  platformSinceLine,
} from "./platform-since";
import { ABOUT_FAQ } from "./about-faq";

describe("platform founding date", () => {
  it("keeps the date the first account and event were created", () => {
    expect(PLATFORM_SINCE_ISO).toBe("2026-04-21");
  });

  it("shows the same date in both languages", () => {
    expect(PLATFORM_SINCE_UK).toContain("2026");
    expect(PLATFORM_SINCE_EN).toContain("2026");
    expect(PLATFORM_SINCE_UK).toContain("квітня");
    expect(PLATFORM_SINCE_EN).toContain("April");
  });

  it("builds the footer line for each language", () => {
    expect(platformSinceLine(true)).toBe("Платформа працює з 21 квітня 2026 року");
    expect(platformSinceLine(false)).toBe("The platform has been running since 21 April 2026");
  });

  it("answers the founding question in the about-page FAQ", () => {
    const found = ABOUT_FAQ.find((f) => f.q.toLowerCase().includes("з якого часу"));
    expect(found?.a).toContain(PLATFORM_SINCE_UK);
  });
});
