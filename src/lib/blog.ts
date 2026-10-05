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
};

export const youtubeEmbed = (url: string | null): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

export const formatBlogDate = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "";
