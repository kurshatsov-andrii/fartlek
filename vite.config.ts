import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// ────────────────────────────────────────────────────────────────
// SEO prerender: generates per-route index.html files in dist/
// with unique <title>, meta description, canonical, OG tags.
// Runs only during `vite build`.
// ────────────────────────────────────────────────────────────────

const truncate = (s: string, max: number) =>
  s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";

const escAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface Meta {
  title: string;
  description: string;
  canonical: string; // absolute URL
  image?: string;
}

const upsertTag = (html: string, regex: RegExp, replacement: string): string => {
  if (regex.test(html)) return html.replace(regex, replacement);
  return html.replace("</head>", `  ${replacement}\n  </head>`);
};

const injectMeta = (baseHtml: string, m: Meta, origin: string): string => {
  const title = truncate(m.title, 60);
  const desc = truncate(m.description, 160);
  const canonical = m.canonical.startsWith("http") ? m.canonical : `${origin}${m.canonical}`;
  const image = m.image ?? "https://storage.googleapis.com/gpt-engineer-file-uploads/fhzHLE2HiFZe0qgeuSJhU49nthl2/social-images/social-1776777612035-fartlek_events.webp";

  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escHtml(title)}</title>`);
  html = upsertTag(
    html,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escAttr(desc)}" />`,
  );
  html = upsertTag(
    html,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escAttr(canonical)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escAttr(title)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escAttr(desc)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${escAttr(canonical)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+property=["']og:image["'][^>]*>/i,
    `<meta property="og:image" content="${escAttr(image)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escAttr(title)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escAttr(desc)}" />`,
  );
  html = upsertTag(
    html,
    /<meta\s+name=["']twitter:image["'][^>]*>/i,
    `<meta name="twitter:image" content="${escAttr(image)}" />`,
  );
  return html;
};

const writeRoute = (distDir: string, routePath: string, html: string) => {
  const clean = routePath.replace(/^\/+|\/+$/g, "");
  const target = clean ? path.join(distDir, clean, "index.html") : path.join(distDir, "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, "utf8");
};

// ── Static SEO copy ────────────────────────────────────────────
const STATIC_PAGES: Array<{ path: string; title: string; description: string }> = [
  {
    path: "/",
    title: "Fartlek Events — реєстрація на забіги в Україні",
    description:
      "Забіги, напівмарафони, марафони, ультра, трейли, OCR та онлайн-старти по всій Україні. Онлайн-реєстрація, QR-квитки, миттєві результати.",
  },
  {
    path: "/category",
    title: "Категорії подій — Fartlek Events",
    description:
      "Усі категорії спортивних подій в Україні: забіги, напівмарафони, марафони, ультра, трейли, OCR та онлайн-старти.",
  },
  {
    path: "/contacts",
    title: "Контакти — Fartlek Events",
    description: "Зв'яжіться з командою Fartlek Events: email, телефон, Telegram. Україна, Харків.",
  },
  {
    path: "/clubs",
    title: "Бігові клуби України — каталог | Fartlek Events",
    description: "Каталог бігових клубів України. Знайди клуб у своєму місті, тренуйся разом, бери участь у стартах.",
  },
  {
    path: "/calendar",
    title: "Календар спортивних подій України | Fartlek Events",
    description: "Календар забігів, марафонів, трейлів та триатлонів в Україні. Онлайн-реєстрація на найближчі старти.",
  },
  {
    path: "/features",
    title: "Можливості для організаторів — Fartlek Events",
    description: "Інструменти для організаторів: реєстрація, оплати, QR-стартові пакети, миттєві результати, розсилки.",
  },
  {
    path: "/testimonials",
    title: "Відгуки організаторів та учасників — Fartlek Events",
    description: "Що кажуть про Fartlek Events організатори та учасники забігів, марафонів і трейлів в Україні.",
  },
];

const CATEGORIES = [
  "run", "half_marathon", "marathon", "ultra", "trail", "ocr",
  "online", "swim", "aquathlon", "duathlon", "cycling", "triathlon",
] as const;

const CAT_TITLES: Record<(typeof CATEGORIES)[number], string> = {
  run: "Забіги в Україні — реєстрація онлайн | Fartlek Events",
  half_marathon: "Напівмарафони в Україні — реєстрація | Fartlek Events",
  marathon: "Марафони в Україні — реєстрація онлайн | Fartlek Events",
  ultra: "Ультрамарафони в Україні — реєстрація | Fartlek Events",
  trail: "Трейли в Україні — реєстрація онлайн | Fartlek Events",
  ocr: "OCR-забіги з перешкодами в Україні | Fartlek Events",
  online: "Онлайн-забіги в Україні — реєстрація | Fartlek Events",
  swim: "Запливи в Україні — реєстрація онлайн | Fartlek Events",
  aquathlon: "Акватлон в Україні — реєстрація | Fartlek Events",
  duathlon: "Дуатлон в Україні — реєстрація | Fartlek Events",
  cycling: "Велогонки в Україні — реєстрація онлайн | Fartlek Events",
  triathlon: "Триатлон в Україні — реєстрація онлайн | Fartlek Events",
};
const CAT_DESCS: Record<(typeof CATEGORIES)[number], string> = {
  run: "Каталог забігів в Україні. Дистанції 5, 10, 15 км. Онлайн-реєстрація, QR-стартові пакети, миттєві результати.",
  half_marathon: "Напівмарафони (21.1 км) в Україні. Розклад стартів, онлайн-реєстрація, миттєві протоколи та QR-квитки.",
  marathon: "Марафони (42.2 км) в Україні. Календар стартів, онлайн-реєстрація, QR-стартові пакети, протоколи.",
  ultra: "Ультрамарафони в Україні від 50 км. Гірські та шосейні старти, онлайн-реєстрація, миттєві результати.",
  trail: "Трейлові забіги в горах і лісах України. Онлайн-реєстрація, QR-квитки, миттєві результати.",
  ocr: "OCR-забіги з перешкодами в Україні. Hyrox, Spartan-формат, командні старти. Онлайн-реєстрація.",
  online: "Онлайн-забіги в Україні: біжи будь-де, завантажуй результат і отримуй медаль. Зручна реєстрація.",
  swim: "Запливи на відкритій воді в Україні. Онлайн-реєстрація, QR-квитки, миттєві результати.",
  aquathlon: "Старти з акватлону в Україні: плавання + біг. Онлайн-реєстрація, QR-квитки, протоколи.",
  duathlon: "Дуатлон в Україні: біг + вело + біг. Календар стартів, онлайн-реєстрація, миттєві результати.",
  cycling: "Велогонки в Україні — шосе, гравій, МТБ. Онлайн-реєстрація, QR-квитки, миттєві результати.",
  triathlon: "Триатлон в Україні: плавання + вело + біг. Спринт, олімпійка, повна дистанція. Онлайн-реєстрація.",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" });

function seoPrerenderPlugin(envOrigin: string, supabaseUrl: string, supabaseKey: string): Plugin {
  return {
    name: "seo-prerender",
    apply: "build",
    enforce: "post",
    closeBundle: {
      sequential: true,
      order: "post",
      handler: async () => {
        const distDir = path.resolve(__dirname, "dist");
        const indexPath = path.join(distDir, "index.html");
        if (!fs.existsSync(indexPath)) {
          console.warn("[seo-prerender] dist/index.html not found, skipping");
          return;
        }
        const baseHtml = fs.readFileSync(indexPath, "utf8");
        const origin = envOrigin.replace(/\/+$/, "");

        let staticCount = 0;
        for (const p of STATIC_PAGES) {
          const html = injectMeta(baseHtml, {
            title: p.title,
            description: p.description,
            canonical: p.path,
          }, origin);
          writeRoute(distDir, p.path, html);
          staticCount++;
        }

        let catCount = 0;
        for (const c of CATEGORIES) {
          const html = injectMeta(baseHtml, {
            title: CAT_TITLES[c],
            description: CAT_DESCS[c],
            canonical: `/category/${c}`,
          }, origin);
          writeRoute(distDir, `/category/${c}`, html);
          catCount++;
        }

        let eventCount = 0;
        if (supabaseUrl && supabaseKey) {
          try {
            const evRes = await fetch(
              `${supabaseUrl}/rest/v1/events?select=id,slug,title,location,event_date,organizer_name,description,image_url,category&status=in.(published,completed)&order=event_date.desc&limit=2000`,
              { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
            );
            if (!evRes.ok) throw new Error(`events fetch ${evRes.status}`);
            const events = (await evRes.json()) as any[];

            const distRes = await fetch(
              `${supabaseUrl}/rest/v1/distances?select=event_id,distance_km&limit=10000`,
              { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
            );
            const distances = (distRes.ok ? await distRes.json() : []) as any[];
            const distByEvent = new Map<string, number[]>();
            for (const d of distances) {
              const list = distByEvent.get(d.event_id) ?? [];
              const km = Number(d.distance_km);
              if (Number.isFinite(km)) list.push(km);
              distByEvent.set(d.event_id, list);
            }

            for (const ev of events) {
              const slugOrId = ev.slug || ev.id;
              const date = formatDate(ev.event_date);
              const cityPart = ev.location ? `, ${ev.location}` : "";
              const distList = (distByEvent.get(ev.id) ?? []).sort((a, b) => a - b);
              const distLabel = distList.length ? `Дистанції: ${distList.join(", ")} км. ` : "";
              const seoTitle = `${ev.title}${cityPart}, ${date}`;
              const seoDesc = `${ev.title}${cityPart}, ${date}. ${distLabel}Організатор: ${ev.organizer_name}.`;
              const html = injectMeta(baseHtml, {
                title: seoTitle,
                description: seoDesc,
                canonical: `/events/${slugOrId}`,
                image: ev.image_url || undefined,
              }, origin);
              writeRoute(distDir, `/events/${slugOrId}`, html);
              // Also write at /events/<id> when slug is set, so direct id links carry meta too
              if (ev.slug && ev.slug !== ev.id) {
                writeRoute(distDir, `/events/${ev.id}`, html);
              }
              eventCount++;
            }
          } catch (err) {
            console.warn("[seo-prerender] events skipped:", (err as Error).message);
          }
        } else {
          console.warn("[seo-prerender] supabase env missing, events skipped");
        }

        console.log(
          `[seo-prerender] wrote ${staticCount} static + ${catCount} category + ${eventCount} event pages`,
        );
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const origin = env.VITE_PUBLIC_SITE_URL || "https://fartlek.com.ua";
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      mode !== "development" &&
        seoPrerenderPlugin(origin, env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY),
    ].filter(Boolean) as Plugin[],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  };
});
