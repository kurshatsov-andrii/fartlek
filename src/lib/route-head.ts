import type { SeoOverride } from "@/lib/page-seo.functions";

const SITE = "https://fartlek.lovable.app";

const clamp = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…");

export type HeadInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: string;
  noindex?: boolean;
  override?: SeoOverride;
};

/** Build SSR head() output (title/description/OG/Twitter/canonical) for a route. */
export const pageHead = ({ title, description, path, image, type = "website", noindex, override }: HeadInput) => {
  const t = clamp(override?.title?.trim() || title, 60);
  const d = clamp(override?.description?.trim() || description, 160);
  const url = `${SITE}${path}`;

  const meta: Array<Record<string, string>> = [
    { title: t },
    { name: "description", content: d },
    { property: "og:title", content: t },
    { property: "og:description", content: d },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { name: "twitter:title", content: t },
    { name: "twitter:description", content: d },
  ];
  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
  }
  if (noindex) meta.push({ name: "robots", content: "noindex, nofollow" });

  return { meta, links: noindex ? [] : [{ rel: "canonical", href: url }] };
};
