import { describe, expect, it } from "vitest";
import { localizeStart } from "./start-translations";

const start = {
  id: "start-1",
  title: "Зимі назустріч",
  description: "Забіг у Центральному парку",
  city: "Харків",
  region: "Харківська область",
  seo_title: "Зимі назустріч — Харків",
  seo_description: "Забіг у Харкові",
  title_en: "Welcoming Winter",
  description_en: "A run in Central Park",
  city_en: "Kharkiv",
  region_en: "Kharkiv Oblast",
  seo_title_en: "Welcoming Winter — Kharkiv",
  seo_description_en: "A run in Kharkiv",
  event_date: "2026-12-06",
  register_url: "https://example.com/register",
};

describe("localizeStart", () => {
  it("uses every saved English field without changing dates or links", () => {
    expect(localizeStart(start, "en")).toMatchObject({
      title: "Welcoming Winter",
      description: "A run in Central Park",
      city: "Kharkiv",
      region: "Kharkiv Oblast",
      seo_title: "Welcoming Winter — Kharkiv",
      seo_description: "A run in Kharkiv",
      event_date: "2026-12-06",
      register_url: "https://example.com/register",
    });
  });

  it("keeps the Ukrainian original when English mode has no usable translation", () => {
    const partial = {
      ...start,
      title_en: "  ",
      description_en: null,
      city_en: null,
      region_en: undefined,
      seo_title_en: "",
      seo_description_en: null,
    };
    expect(localizeStart(partial, "en")).toMatchObject({
      title: start.title,
      description: start.description,
      city: start.city,
      region: start.region,
      seo_title: start.seo_title,
      seo_description: start.seo_description,
    });
  });

  it("always shows the Ukrainian original in Ukrainian mode", () => {
    expect(localizeStart(start, "uk")).toMatchObject({
      title: start.title,
      description: start.description,
      city: start.city,
      region: start.region,
      seo_title: start.seo_title,
      seo_description: start.seo_description,
    });
  });
});
