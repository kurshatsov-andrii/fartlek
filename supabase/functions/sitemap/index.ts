import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://fartlek.lovable.app";

const CATEGORIES = ["run", "half_marathon", "marathon", "ultra", "trail", "ocr", "online"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function urlEntry(loc: string, opts: { lastmod?: string; changefreq?: string; priority?: string } = {}) {
  const parts = [`  <url>`, `    <loc>${loc}</loc>`];
  if (opts.lastmod) parts.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) parts.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority) parts.push(`    <priority>${opts.priority}</priority>`);
  parts.push(`  </url>`);
  return parts.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: events, error } = await supabase
      .from("events")
      .select("slug, updated_at, status")
      .in("status", ["published", "completed"])
      .not("slug", "is", null);

    if (error) throw error;

    const urls: string[] = [];

    // Static pages
    urls.push(urlEntry(`${SITE_URL}/`, { changefreq: "daily", priority: "1.0" }));
    urls.push(urlEntry(`${SITE_URL}/category`, { changefreq: "weekly", priority: "0.9" }));
    for (const cat of CATEGORIES) {
      urls.push(urlEntry(`${SITE_URL}/category/${cat}`, { changefreq: "weekly", priority: "0.8" }));
    }
    urls.push(urlEntry(`${SITE_URL}/contacts`, { changefreq: "monthly", priority: "0.5" }));
    urls.push(urlEntry(`${SITE_URL}/auth`, { changefreq: "monthly", priority: "0.4" }));

    // Dynamic event pages
    for (const ev of events ?? []) {
      if (!ev.slug) continue;
      const lastmod = ev.updated_at ? new Date(ev.updated_at).toISOString().slice(0, 10) : undefined;
      urls.push(
        urlEntry(`${SITE_URL}/events/${ev.slug}`, {
          lastmod,
          changefreq: "weekly",
          priority: "0.9",
        })
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (e) {
    console.error("sitemap error", e);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
    });
  }
});
