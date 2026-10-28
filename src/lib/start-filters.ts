// Shared filtering helpers for start listings (Starts page and category pages).
// Keeps distance buckets, city detection and month facets identical everywhere.
import { UA_CITY_COORDS, normalizeCityKey, prettyCity } from "@/lib/uaCities";
import type { EventCategory } from "@/lib/i18n";
import type { SportType } from "@/lib/parseStart";

export const DISTANCE_BUCKETS: { label: string; match: (d: number) => boolean }[] = [
  { label: "до 5 км", match: (d) => d > 0 && d <= 5 },
  { label: "10 км", match: (d) => d > 5 && d <= 12 },
  { label: "21 км", match: (d) => d > 12 && d <= 25 },
  { label: "42 км", match: (d) => d > 25 && d <= 45 },
  { label: "> 50 км", match: (d) => d > 45 },
];

// A category maps to the same sport type on telegram starts; "jumps" has none yet.
export const categorySport = (cat: EventCategory): SportType | null =>
  cat === "jumps" ? null : (cat as SportType);

// "Харків, вул. Сумська, 36" → "Харків"
export const baseCity = (c: string | null | undefined) => (c ?? "").split(",")[0].trim();

const CITY_KEYS_BY_LENGTH = Object.keys(UA_CITY_COORDS).sort((a, b) => b.length - a.length);

// Free-text location ("м. Одеса, Порт") → a known city name, or null when none matches.
export const detectCity = (location: string | null | undefined): string | null => {
  if (!location) return null;
  const key = normalizeCityKey(location);
  if (!key) return null;
  // Earliest mention wins ("Вараш, Рівненська область" → Вараш, not Рівне); longer names win ties.
  let best: string | null = null;
  let bestAt = Infinity;
  for (const name of CITY_KEYS_BY_LENGTH) {
    if (name.length <= 3) continue;
    const at = key.indexOf(name);
    if (at >= 0 && at < bestAt) { best = name; bestAt = at; }
  }
  return best ? prettyCity(best) : null;
};

export const monthOf = (d: string | null | undefined) =>
  d ? parseInt(d.split("-")[1] ?? "0", 10) : 0;

export const matchesDistance = (
  dists: (number | string)[] | null | undefined,
  bucket: { label: string; match: (d: number) => boolean } | null
) => !bucket || (dists ?? []).some((d) => bucket.match(Number(d)));
