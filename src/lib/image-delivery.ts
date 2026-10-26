/** Use the managed image service only for this project's public stored images. */
export function imageDeliveryUrl(src: string, width: number, quality = 78, storageUrl = import.meta.env.VITE_SUPABASE_URL): string {
  if (!storageUrl) return src;
  try {
    const url = new URL(src);
    const storage = new URL(storageUrl);
    if (url.protocol !== "https:" || url.origin !== storage.origin || !url.pathname.startsWith("/storage/v1/object/public/") || /\.(svg|gif)$/i.test(url.pathname)) return src;
    url.pathname = url.pathname.replace("/object/public/", "/render/image/public/");
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", String(quality));
    url.searchParams.set("resize", "contain");
    return url.href;
  } catch {
    return src;
  }
}