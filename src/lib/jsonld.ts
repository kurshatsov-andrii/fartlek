import { SITE_URL } from "@/lib/discovery-seo";

export type JsonLd = Record<string, unknown>;

const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

/** BreadcrumbList for a route; the last item is the current page. */
export const breadcrumbJsonLd = (items: Array<{ name: string; path: string }>): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: abs(it.path),
  })),
});

/** SportsEvent markup for a race/start page. */
export const sportsEventJsonLd = (e: {
  name: string;
  description?: string | null;
  image?: string | null;
  path: string;
  startDate?: string | null;
  city?: string | null;
  organizer?: string | null;
  cancelled?: boolean;
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: e.name,
  ...(e.description ? { description: e.description } : {}),
  ...(e.image ? { image: [e.image] } : {}),
  url: abs(e.path),
  ...(e.startDate ? { startDate: e.startDate } : {}),
  eventStatus: e.cancelled ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
  ...(e.city ? { location: {
    "@type": "Place",
    name: e.city,
    address: {
      "@type": "PostalAddress",
      ...(e.city ? { addressLocality: e.city } : {}),
      addressCountry: "UA",
    },
  } } : {}),
  ...(e.organizer ? { organizer: {
    "@type": "Organization",
    name: e.organizer,
  } } : {}),
});

/** Article markup for blog posts and running tips. */
export const articleJsonLd = (a: {
  title: string;
  description?: string | null;
  image?: string | null;
  path: string;
  datePublished?: string | null;
  dateModified?: string | null;
  type?: "Article" | "BlogPosting";
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": a.type ?? "Article",
  headline: a.title,
  ...(a.description ? { description: a.description } : {}),
  ...(a.image ? { image: [a.image] } : {}),
  mainEntityOfPage: abs(a.path),
  ...(a.datePublished ? { datePublished: a.datePublished } : {}),
  ...(a.dateModified ? { dateModified: a.dateModified } : {}),
  author: { "@type": "Organization", name: "Fartlek Events", url: SITE_URL },
  publisher: { "@type": "Organization", name: "Fartlek Events", url: SITE_URL },
});

export type OrganizationInput = {
  name: string;
  path: string;
  description?: string | null;
  image?: string | null;
  city?: string | null;
  email?: string | null;
  telephone?: string | null;
  foundingDate?: string | null;
  sameAs?: string[];
};

/** Public entity facts only; SportsClub is a subtype of SportsOrganization. */
export const entityOrganizationJsonLd = (o: OrganizationInput, type: "Organization" | "SportsClub" = "Organization"): JsonLd => ({
  "@context": "https://schema.org",
  "@type": type,
  "@id": `${abs(o.path)}#organization`,
  name: o.name,
  url: abs(o.path),
  ...(o.description ? { description: o.description } : {}),
  ...(o.image ? { image: o.image, logo: o.image } : {}),
  ...(o.city ? { address: { "@type": "PostalAddress", addressLocality: o.city, addressCountry: "UA" } } : {}),
  ...(o.email ? { email: o.email } : {}),
  ...(o.telephone ? { telephone: o.telephone } : {}),
  ...(o.foundingDate ? { foundingDate: o.foundingDate } : {}),
  ...(o.sameAs?.length ? { sameAs: o.sameAs } : {}),
});

export const organizerProfileJsonLd = (o: OrganizationInput): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": abs(o.path),
  url: abs(o.path),
  name: o.name,
  mainEntity: entityOrganizationJsonLd(o),
});

/** Organization + WebSite markup for the homepage. */
export const organizationJsonLd = (): JsonLd[] => [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Fartlek Events",
    alternateName: "Фартлек",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/favicon.png`,
    image: `${SITE_URL}/favicon.png`,
    description:
      "Fartlek.com.ua — українська платформа, що об'єднує бігунів, бігові клуби й організаторів спортивних подій.",
    email: "info@fartlek.com.ua",
    telephone: "+380972520551",
    address: { "@type": "PostalAddress", addressCountry: "UA" },
    areaServed: { "@type": "Country", name: "Ukraine" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "info@fartlek.com.ua",
      telephone: "+380972520551",
      availableLanguage: ["Ukrainian", "English"],
    },
    sameAs: [
      "https://www.instagram.com/fartlekua/",
      "https://t.me/+5-5XOFyn0JUxMTli",
      "https://t.me/+KgEHRsz677s4Zjhi",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Fartlek Events",
    alternateName: "Фартлек",
    url: `${SITE_URL}/`,
    inLanguage: "uk",
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
];


/** head() scripts entry for one or more JSON-LD blocks. */
export const jsonLdScript = (data: JsonLd | JsonLd[]) => ({
  type: "application/ld+json" as const,
  children: JSON.stringify(data),
});
