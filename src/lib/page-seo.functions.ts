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
