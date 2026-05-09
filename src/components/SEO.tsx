import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  /** Override path key (defaults to current pathname) */
  path?: string;
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

// Tiny in-memory cache to avoid refetching on every nav
const overrideCache = new Map<string, { title: string | null; description: string | null }>();

export const SEO = ({ title, description, canonical, image, jsonLd, path }: SEOProps) => {
  const location = useLocation();
  const key = path ?? location.pathname;
  const [override, setOverride] = useState<{ title: string | null; description: string | null } | null>(
    overrideCache.get(key) ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    if (overrideCache.has(key)) {
      setOverride(overrideCache.get(key)!);
      return;
    }
    supabase
      .from("seo_overrides")
      .select("title,description")
      .eq("path", key)
      .maybeSingle()
      .then(({ data }) => {
        const value = { title: data?.title ?? null, description: data?.description ?? null };
        overrideCache.set(key, value);
        if (!cancelled) setOverride(value);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    const finalTitle = override?.title?.trim() ? override.title : title;
    const finalDesc = override?.description?.trim() ? override.description : description;
    const t = finalTitle.length > 60 ? finalTitle.slice(0, 57) + "…" : finalTitle;
    const d = finalDesc.length > 160 ? finalDesc.slice(0, 157) + "…" : finalDesc;
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

    const existing = document.head.querySelector('script[data-seo-jsonld="true"]');
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, image, JSON.stringify(jsonLd), override?.title, override?.description]);

  return null;
};

/** Invalidate cached SEO override for a path (used after admin save). */
export const invalidateSeoOverride = (path: string) => {
  overrideCache.delete(path);
};
