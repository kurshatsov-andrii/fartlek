import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { OrganizationInput } from "@/lib/jsonld";
import { optionalMetadata } from "@/lib/optional-metadata";

const SITE = "https://fartlek.com.ua";

function publicClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = (process.env["SUPABASE_ANON_KEY"] ??
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]);
  if (!url || !key) throw new Error("Public content unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  } } });
}

export type SeoOverride = { title: string | null; description: string | null } | null;

/** Admin-managed per-path title/description override (used during SSR). */
const getSeoOverrideRpc = createServerFn({ method: "GET" })
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
  startDate?: string | null;
  location?: string | null;
  organizerName?: string | null;
  name?: string;
  cancelled?: boolean;
} | null;

/** Server-rendered metadata for an event page (by uuid or slug). */
const getEventSeoRpc = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<EventSeo> => {
    try {
      const supabase = publicClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
      const { data: ev } = await supabase
        .from("events")
        .select("id,slug,title,location,event_date,description,image_url,organizer_name,status")
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
        name: row.title,
        cancelled: row.status === "cancelled",
        startDate: row.event_date ?? null,
        location: city || null,
        organizerName: row.organizer_name ?? null,
      };
    } catch {
      return null;
    }
  });

export const SITE_URL = SITE;

export type EntitySeo = { title: string; description: string; image: string | null; path: string; startDate?: string | null; city?: string | null; name?: string; organizerName?: string | null; cancelled?: boolean; datePublished?: string | null; dateModified?: string | null; organization?: OrganizationInput } | null;

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const isUuidStr = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

async function fetchBySlug(table: string, slug: string) {
  const sb = publicClient();
  const { data } = await sb.from(table as any).select("*").eq(isUuidStr(slug) ? "id" : "slug", slug).maybeSingle();
  return (data as Record<string, any> | null) ?? null;
}

/** Server-rendered metadata for a club page. */
const getClubSeoRpc = createServerFn({ method: "GET" })
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
        name: c.name,
        organization: { name: c.name, path: `/clubs/${c.slug ?? c.id}`, description: raw || desc,
          image: c.logo_url, city: c.city, email: c.contact_email, telephone: c.contact_phone,
          foundingDate: c.founded_year ? String(c.founded_year) : null,
          sameAs: [c.website_url, c.instagram_url, c.facebook_url, c.telegram_url, c.strava_url, c.youtube_url].filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url)),
        },
      };
    } catch { return null; }
  });

/** Server-rendered metadata for an organizer page. */
const getOrganizerSeoRpc = createServerFn({ method: "GET" })
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
        name: o.name,
        organization: { name: o.name, path: `/organizers/${o.slug ?? o.id}`, description: raw || desc,
          image: o.logo_url, city: o.city, email: o.contact_email, telephone: o.contact_phone,
          foundingDate: o.founded_year ? String(o.founded_year) : null,
          sameAs: [o.website_url, o.instagram_url, o.facebook_url, o.telegram_url, o.strava_url, o.youtube_url].filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url)),
        },
      };
    } catch { return null; }
  });

/** Server-rendered metadata for a Telegram start page. */
const getStartSeoRpc = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<EntitySeo> => {
    try {
      const { data: r } = await publicClient().from("telegram_starts" as any)
        .select("slug,title,description,image_url,event_date,seo_title,seo_description,city,organizer_name,registration_status")
        .eq("slug", data.slug).eq("status", "published").maybeSingle();
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
        name: s.title,
        organizerName: s.organizer_name,
        cancelled: s.registration_status === "cancelled",
        startDate: s.event_date ?? null,
        city: s.city ?? null,
      };
    } catch { return null; }
  });

/** Only published blog content contributes to public metadata. */
const getBlogSeoRpc = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<EntitySeo> => {
    const { data: post } = await publicClient().from("blog_posts")
      .select("slug,title,excerpt,content,cover_url,updated_at").eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (!post) return null;
    const raw = (post.excerpt || post.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return { title: cut(`${post.title} | Фартлек`, 60), description: cut(raw || `${post.title}. Історія, фото та відео бігової спільноти Фартлек.`, 160), image: post.cover_url?.startsWith("https://") ? post.cover_url : null, path: `/blog/${post.slug}`, name: post.title, dateModified: post.updated_at };
  });

export const getSeoOverride = (input: { data: { path: string } }) => optionalMetadata(() => getSeoOverrideRpc(input));
export const getEventSeo = (input: { data: { id: string } }) => optionalMetadata(() => getEventSeoRpc(input));
export const getClubSeo = (input: { data: { slug: string } }) => optionalMetadata(() => getClubSeoRpc(input));
export const getOrganizerSeo = (input: { data: { slug: string } }) => optionalMetadata(() => getOrganizerSeoRpc(input));
export const getStartSeo = (input: { data: { slug: string } }) => optionalMetadata(() => getStartSeoRpc(input));
export const getBlogSeo = (input: { data: { slug: string } }) => optionalMetadata(() => getBlogSeoRpc(input));

/** Only published running tips contribute to public metadata. */
const getTipSeoRpc = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<EntitySeo> => {
    const { data: tip } = await publicClient().from("running_tips")
      .select("slug,category,title,excerpt,content,cover_url,published_on,updated_at").eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (!tip) return null;
    const raw = (tip.excerpt || tip.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return { title: cut(`${tip.title} | Фартлек`, 60), description: cut(raw || `${tip.title}. Поради бігунам від Фартлек.`, 160), image: tip.cover_url?.startsWith("https://") ? tip.cover_url : null, path: `/tips/${tip.category}/${tip.slug}`, name: tip.title, datePublished: tip.published_on, dateModified: tip.updated_at };
  });
export const getTipSeo = (input: { data: { slug: string } }) => optionalMetadata(() => getTipSeoRpc(input));

export const getTipArticle = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const { data: tip } = await publicClient().from("running_tips").select("*").eq("slug", data.slug).eq("is_published", true).maybeSingle();
    return tip ?? null;
  });
