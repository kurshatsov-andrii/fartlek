import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const SITE = "https://fartlek.lovable.app";

function publicClient() {
  const url = (process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"])!;
  const key = (process.env["SUPABASE_ANON_KEY"] ??
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"])!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type SeoOverride = { title: string | null; description: string | null } | null;

/** Admin-managed per-path title/description override (used during SSR). */
export const getSeoOverride = createServerFn({ method: "GET" })
  .inputValidator((data: { path: string }) => data)
  .handler(async ({ data }): Promise<SeoOverride> => {
    try {
      const { data: row } = await publicClient()
        .from("seo_overrides")
        .select("title,description")
        .eq("path", data.path)
        .maybeSingle();
      if (!row) return null;
      return { title: row.title ?? null, description: row.description ?? null };
    } catch {
      return null;
    }
  });

export type EventSeo = {
  title: string;
  description: string;
  image: string | null;
  path: string;
} | null;

/** Server-rendered metadata for an event page (by uuid or slug). */
export const getEventSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<EventSeo> => {
    try {
      const supabase = publicClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
      const { data: ev } = await supabase
        .from("events")
        .select("id,slug,title,location,event_date,description,image_url,organizer_name")
        .eq(isUuid ? "id" : "slug", data.id)
        .maybeSingle();
      if (!ev) return null;

      const row = ev as Record<string, any>;
      const city = (row.location ?? "") as string;
      const date = row.event_date
        ? new Date(row.event_date).toLocaleDateString("uk-UA", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "";
      const titleParts = [row.title, city, date].filter(Boolean).join(", ");
      const raw = (row.description ?? "").replace(/\s+/g, " ").trim();
      const desc =
        raw.length > 0
          ? raw
          : `${row.title}${city ? ` — ${city}` : ""}${date ? `, ${date}` : ""}. Онлайн-реєстрація на Fartlek Events.`;

      const image =
        typeof row.image_url === "string" && row.image_url.startsWith("http")
          ? row.image_url
          : null;

      return {
        title: titleParts.length > 60 ? titleParts.slice(0, 59) + "…" : titleParts,
        description: desc.length > 160 ? desc.slice(0, 157) + "…" : desc,
        image,
        path: `/events/${row.slug ?? row.id}`,
      };
    } catch {
      return null;
    }
  });

export const SITE_URL = SITE;

export type EntitySeo = { title: string; description: string; image: string | null; path: string } | null;

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const isUuidStr = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

async function fetchBySlug(table: string, slug: string) {
  const sb = publicClient();
  const { data } = await sb.from(table as any).select("*").eq(isUuidStr(slug) ? "id" : "slug", slug).maybeSingle();
  return (data as Record<string, any> | null) ?? null;
}

/** Server-rendered metadata for a club page. */
export const getClubSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<EntitySeo> => {
    try {
      const c = await fetchBySlug("clubs", data.slug);
      if (!c) return null;
      const types = (c.activity_types ?? []) as string[];
      const kind = types.includes("trail") && !types.includes("road_run") ? "Трейловий клуб"
        : types.includes("ocr") ? "OCR клуб" : types.includes("triathlon") ? "Триатлон клуб" : "Біговий клуб";
      const title = c.city ? `${kind} ${c.name} — ${c.city}` : `${kind} ${c.name}`;
      const raw = (c.description ?? "").replace(/\s+/g, " ").trim();
      const desc = raw.length > 40 ? raw
        : `${kind} ${c.name}${c.city ? ` у місті ${c.city}` : ""}: тренування, розклад, контакти та старти клубу на Fartlek Events.`;
      return {
        title: cut(title, 60), description: cut(desc, 160),
        image: typeof c.logo_url === "string" && c.logo_url.startsWith("http") ? c.logo_url : null,
        path: `/clubs/${c.slug ?? c.id}`,
      };
    } catch { return null; }
  });

/** Server-rendered metadata for an organizer page. */
export const getOrganizerSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<EntitySeo> => {
    try {
      const o = await fetchBySlug("organizers", data.slug);
      if (!o) return null;
      const title = o.city ? `Організатор ${o.name} — ${o.city}` : `Організатор ${o.name}`;
      const raw = (o.description ?? "").replace(/\s+/g, " ").trim();
      const desc = raw.length > 40 ? raw
        : `Організатор спортивних подій ${o.name}${o.city ? ` (${o.city})` : ""}: забіги, старти, контакти та реєстрація на Fartlek Events.`;
      return {
        title: cut(title, 60), description: cut(desc, 160),
        image: typeof o.logo_url === "string" && o.logo_url.startsWith("http") ? o.logo_url : null,
        path: `/organizers/${o.slug ?? o.id}`,
      };
    } catch { return null; }
  });

/** Server-rendered metadata for a Telegram start page. */
export const getStartSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<EntitySeo> => {
    try {
      const { data: r } = await publicClient().from("telegram_starts" as any)
        .select("slug,title,description,image_url,event_date,seo_title,seo_description,city")
        .eq("slug", data.slug).maybeSingle();
      const s = r as Record<string, any> | null;
      if (!s) return null;
      const date = s.event_date ? new Date(s.event_date).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "";
      const title = s.seo_title || [s.title, s.city, date].filter(Boolean).join(", ");
      const raw = (s.seo_description || s.description || "").replace(/\s+/g, " ").trim();
      const desc = raw || `${s.title}${s.city ? ` — ${s.city}` : ""}${date ? `, ${date}` : ""}. Дистанції та реєстрація на Fartlek Events.`;
      return {
        title: cut(title, 60), description: cut(desc, 160),
        image: typeof s.image_url === "string" && s.image_url.startsWith("http") ? s.image_url : null,
        path: `/starts/${s.slug}`,
      };
    } catch { return null; }
  });
