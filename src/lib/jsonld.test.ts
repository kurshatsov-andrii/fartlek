import { describe, expect, it } from "vitest";
import { articleJsonLd, breadcrumbJsonLd, entityOrganizationJsonLd, organizationJsonLd, organizerProfileJsonLd, sportsEventJsonLd } from "./jsonld";

describe("Public structured data", () => {
  it("identifies the homepage organization and website", () => {
    expect(organizationJsonLd().map((item) => item["@type"])).toEqual(["Organization", "WebSite"]);
  });
  it("uses the real race name and omits unknown organizers and venues", () => {
    const event = sportsEventJsonLd({ name: "Лучеськ півмарафон", path: "/starts/lutsk", startDate: "2026-11-08" });
    expect(event.name).toBe("Лучеськ півмарафон");
    expect(event.startDate).toBe("2026-11-08");
    expect(event).not.toHaveProperty("organizer");
    expect(event).not.toHaveProperty("location");
  });
  it("preserves a sourced organizer and cancelled race status", () => {
    const event = sportsEventJsonLd({ name: "Забіг", path: "/events/race", city: "Харків", organizer: "Організатор забігу", cancelled: true });
    expect(event.organizer).toEqual({ "@type": "Organization", name: "Організатор забігу" });
    expect(event.eventStatus).toBe("https://schema.org/EventCancelled");
  });
  it("builds absolute ordered breadcrumb URLs", () => {
    expect(breadcrumbJsonLd([{ name: "Головна", path: "/" }, { name: "Клуби", path: "/clubs" }]).itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Головна", item: "https://fartlek.com.ua/" },
      { "@type": "ListItem", position: 2, name: "Клуби", item: "https://fartlek.com.ua/clubs" },
    ]);
  });
  it("identifies clubs with the SportsOrganization subtype", () => {
    expect(entityOrganizationJsonLd({ name: "Клуб", path: "/clubs/club" }, "SportsClub")["@type"]).toBe("SportsClub");
  });
  it("describes an organizer profile as an organization rather than a person", () => {
    const profile = organizerProfileJsonLd({ name: "Організатор", path: "/organizers/org" });
    expect(profile["@type"]).toBe("ProfilePage");
    expect(profile.mainEntity).toMatchObject({ "@type": "Organization", name: "Організатор", "@id": "https://fartlek.com.ua/organizers/org#organization" });
  });
  it("includes sourced article dates without inventing a publication date", () => {
    const article = articleJsonLd({ title: "Стаття", path: "/blog/article", type: "BlogPosting", dateModified: "2026-10-24T09:00:00Z" });
    expect(article["@type"]).toBe("BlogPosting");
    expect(article.dateModified).toBe("2026-10-24T09:00:00Z");
    expect(article).not.toHaveProperty("datePublished");
    expect(articleJsonLd({ title: "Порада", path: "/tips/starty/tip", datePublished: "2026-10-20" }).datePublished).toBe("2026-10-20");
  });
});