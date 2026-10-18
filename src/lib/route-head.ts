import type { SeoOverride } from "@/lib/page-seo.functions";
import { SITE_URL, clampSeo } from "@/lib/discovery-seo";

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
  const t = clampSeo(override?.title?.trim() || title, 60);
  const d = clampSeo(override?.description?.trim() || description, 160);
  const url = `${SITE_URL}${path}`;

  const meta: Array<Record<string, string>> = [
    { title: t },
    { name: "description", content: d },
    { property: "og:title", content: t },
    { property: "og:description", content: d },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { name: "twitter:title", content: t },
    { name: "twitter:description", content: d },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (image?.startsWith("https://")) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
  }
  if (noindex) meta.push({ name: "robots", content: "noindex, nofollow" });

  return { meta, links: noindex ? [] : [{ rel: "canonical", href: url }] };
};
