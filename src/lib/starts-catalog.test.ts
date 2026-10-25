import { describe, expect, it } from "vitest";
import { mergeStartsCatalog, type CatalogEvent, type ExternalCatalogStart } from "./starts-catalog";
import { canShowRegisterButton } from "./registration-status";
import { matchesDistance, DISTANCE_BUCKETS } from "./start-filters";

const event: CatalogEvent = {
  id: "ekiden", slug: "ekiden-kharikofu", title: "EKIDEN KHARIKOFU 10K 2026",
  description: null, organizer_name: "Фартлек", event_date: "2026-11-15",
  location: "Харків, стадіон ХПІ", image_url: null, is_paid: true, category: "run",
  registration_closed: false, registration_opens_on: null, results_url: null, results_pdf_url: null,
  distances: [{ distance_km: 10, is_active: true }, { distance_km: 21, is_active: false }],
};
const external: ExternalCatalogStart = {
  id: "external", slug: "external-race", title: "Інший старт", description: null,
  image_url: null, register_url: "https://example.org/register", results_url: null,
  registration_status: null, event_date: "2026-11-08", city: "Луцьк, площа",
  region: null, organizer_name: null, sport_types: ["half_marathon"], distances_km: [21.1], is_paid: true,
};

describe("unified Starts catalog", () => {
  it("includes EKIDEN and Bilka alongside external starts with their original source and links", () => {
    const rows = mergeStartsCatalog([external], [event, { ...event, id: "bilka", slug: "bilka-run-harkiv-2026", title: "Білка Run" }]);
    expect(rows.map((row) => row.title)).toEqual(["Інший старт", "EKIDEN KHARIKOFU 10K 2026", "Білка Run"]);
    expect(rows.map((row) => [row.source, row.url])).toEqual([
      ["start", "/starts/external-race"], ["event", "/events/ekiden-kharikofu"], ["event", "/events/bilka-run-harkiv-2026"],
    ]);
  });
  it("exposes the event city, sport and active distances to the same filters", () => {
    const [row] = mergeStartsCatalog([], [event]);
    expect(row.city).toBe("Харків");
    expect(row.sport_types).toEqual(["run"]);
    expect(row.distances_km).toEqual([10]);
    expect(matchesDistance(row.distances_km, DISTANCE_BUCKETS.find((bucket) => bucket.label === "10 км") ?? null)).toBe(true);
  });
  it("does not offer registration for a closed platform event", () => {
    const [row] = mergeStartsCatalog([], [{ ...event, registration_closed: true }]);
    expect(canShowRegisterButton({ closed: row.registration_closed, defaultOpen: row.source === "event", date: row.event_date, today: "2026-10-25" })).toBe(false);
  });
});