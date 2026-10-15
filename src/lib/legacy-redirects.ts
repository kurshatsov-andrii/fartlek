// Old fartlek.com.ua URLs -> new paths. Permanent (301) redirects for Google.
// Keys: old path without trailing slash, lowercase.
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/sport-events-ukraine": "/calendar",
  "/autumn-odesa-half-marathon-2026": "/starts/autumn-odesa-half-marathon-2026-11-15",
  "/bigotrail-chernivtsi-2026": "/events/bigotreyl-chernivci-chernivci-2026",
};

export function findLegacyRedirect(pathname: string): string | null {
  let p = pathname.toLowerCase();
  try { p = decodeURIComponent(p); } catch { /* keep raw */ }
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return LEGACY_REDIRECTS[p] ?? null;
}
