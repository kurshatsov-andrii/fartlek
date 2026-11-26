export const INSTAGRAM_URL = "https://www.instagram.com/fartlekua/";
export const TELEGRAM_CHAT_URL = "https://t.me/+KgEHRsz677s4Zjhi";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  event_date: string | null;
  location: string | null;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  photos: string[];
  youtube_url: string | null;
  photos_album_url: string | null;
  is_published: boolean;
  title_en?: string | null;
  excerpt_en?: string | null;
  content_en?: string | null;
  location_en?: string | null;
};

/** English view of a post: *_en fields when filled, Ukrainian originals otherwise. */
export const localizePost = <T extends BlogPost>(p: T, lang: string): T => lang !== "en" ? p : {
  ...p,
  title: p.title_en?.trim() || p.title,
  excerpt: p.excerpt_en?.trim() || p.excerpt,
  content: p.content_en?.trim() || p.content,
  location: p.location_en?.trim() || p.location,
};

export const youtubeEmbed = (url: string | null): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

export const formatBlogDate = (d: string | null, lang: string = "uk") =>
  d ? new Date(d + "T00:00:00").toLocaleDateString(lang === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "";
