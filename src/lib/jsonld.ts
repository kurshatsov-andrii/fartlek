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
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: e.name,
  ...(e.description ? { description: e.description } : {}),
  ...(e.image ? { image: [e.image] } : {}),
  url: abs(e.path),
  ...(e.startDate ? { startDate: e.startDate } : {}),
  eventStatus: "https://schema.org/EventScheduled",
  location: {
    "@type": "Place",
    name: e.city || "Україна",
    address: {
      "@type": "PostalAddress",
      ...(e.city ? { addressLocality: e.city } : {}),
      addressCountry: "UA",
    },
  },
  organizer: {
    "@type": "Organization",
    name: e.organizer || "Fartlek Events",
    url: SITE_URL,
  },
});

/** Article markup for blog posts and running tips. */
export const articleJsonLd = (a: {
  title: string;
  description?: string | null;
  image?: string | null;
  path: string;
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: a.title,
  ...(a.description ? { description: a.description } : {}),
  ...(a.image ? { image: [a.image] } : {}),
  mainEntityOfPage: abs(a.path),
  author: { "@type": "Organization", name: "Fartlek Events", url: SITE_URL },
  publisher: { "@type": "Organization", name: "Fartlek Events", url: SITE_URL },
});

/** Organization + WebSite markup for the homepage. */
export const organizationJsonLd = (): JsonLd[] => [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Fartlek Events",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/favicon.png`,
    sameAs: [SITE_URL],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fartlek Events",
    url: `${SITE_URL}/`,
  },
];

/** head() scripts entry for one or more JSON-LD blocks. */
export const jsonLdScript = (data: JsonLd | JsonLd[]) => ({
  type: "application/ld+json" as const,
  children: JSON.stringify(data),
});
