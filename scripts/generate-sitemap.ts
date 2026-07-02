// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://fartlek.lovable.app";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://mjkjygzxwysbhgjtvobm.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qa2p5Z3p4d3lzYmhnanR2b2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzEwMTMsImV4cCI6MjA5MjM0NzAxM30.t-st7SweqwIw_4e2crdQ4pjB3IGXGSbzkJcOVkwEN5U";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const today = new Date().toISOString().slice(0, 10);

const CATEGORIES = [
  "road_run",
  "trail",
  "ocr",
  "triathlon",
  "duathlon",
  "aquathlon",
  "cycling",
  "swimming",
  "cross",
];

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/calendar", changefreq: "daily", priority: "0.9" },
  { path: "/starts", changefreq: "daily", priority: "0.9" },
  { path: "/clubs", changefreq: "weekly", priority: "0.9" },
  { path: "/organizers", changefreq: "weekly", priority: "0.9" },
  { path: "/category", changefreq: "weekly", priority: "0.8" },
  { path: "/features", changefreq: "monthly", priority: "0.6" },
  { path: "/testimonials", changefreq: "monthly", priority: "0.6" },
  { path: "/contacts", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/public-offer", changefreq: "yearly", priority: "0.3" },
  { path: "/user-agreement", changefreq: "yearly", priority: "0.3" },
  ...CATEGORIES.map<SitemapEntry>((c) => ({
    path: `/category/${c}`,
    changefreq: "weekly",
    priority: "0.7",
  })),
];

async function fetchRows(
  table: string,
  query: string,
): Promise<Array<Record<string, any>>> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) {
      console.warn(`sitemap: ${table} fetch failed (${res.status})`);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.warn(`sitemap: ${table} fetch error`, e);
    return [];
  }
}

function formatDate(value: unknown): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  return value.slice(0, 10);
}

async function buildDynamicEntries(): Promise<SitemapEntry[]> {
  const [events, starts, clubs, organizers] = await Promise.all([
    fetchRows("events", "select=id,slug,updated_at&status=eq.published&slug=not.is.null"),
    fetchRows(
      "telegram_starts",
      "select=slug,updated_at&status=eq.published&slug=not.is.null",
    ),
    fetchRows("clubs", "select=slug,updated_at&slug=not.is.null"),
    fetchRows("organizers", "select=slug,updated_at&slug=not.is.null"),
  ]);

  const entries: SitemapEntry[] = [];

  for (const e of events) {
    if (!e.slug) continue;
    entries.push({
      path: `/events/${e.id}`,
      lastmod: formatDate(e.updated_at) ?? today,
      changefreq: "weekly",
      priority: "0.8",
    });
  }
  for (const s of starts) {
    entries.push({
      path: `/starts/${s.slug}`,
      lastmod: formatDate(s.updated_at) ?? today,
      changefreq: "weekly",
      priority: "0.7",
    });
  }
  for (const c of clubs) {
    entries.push({
      path: `/clubs/${c.slug}`,
      lastmod: formatDate(c.updated_at) ?? today,
      changefreq: "monthly",
      priority: "0.6",
    });
  }
  for (const o of organizers) {
    entries.push({
      path: `/organizers/${o.slug}`,
      lastmod: formatDate(o.updated_at) ?? today,
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  return entries;
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&apos;",
  );
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${escapeXml(BASE_URL + e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

(async () => {
  const dynamic = await buildDynamicEntries();
  const stamped = staticEntries.map((e) => ({ lastmod: today, ...e }));
  const all = [...stamped, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(all));
  console.log(`sitemap.xml written (${all.length} entries)`);
})();
