import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const setMeta = (selector: string, attr: "name" | "property", key: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const SEO = ({ title, description, canonical, image, jsonLd }: SEOProps) => {
  useEffect(() => {
    const t = title.length > 60 ? title.slice(0, 57) + "…" : title;
    const d = description.length > 160 ? description.slice(0, 157) + "…" : description;
    document.title = t;

    setMeta('meta[name="description"]', "name", "description", d);
    setMeta('meta[property="og:title"]', "property", "og:title", t);
    setMeta('meta[property="og:description"]', "property", "og:description", d);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", t);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", d);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");

    if (image) {
      setMeta('meta[property="og:image"]', "property", "og:image", image);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    }

    const url = canonical
      ? (canonical.startsWith("http") ? canonical : `${window.location.origin}${canonical}`)
      : window.location.href;
    setLink("canonical", url);
    setMeta('meta[property="og:url"]', "property", "og:url", url);

    // JSON-LD
    const existing = document.head.querySelector('script[data-seo-jsonld="true"]');
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, image, JSON.stringify(jsonLd)]);

  return null;
};
