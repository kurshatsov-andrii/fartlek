interface CalendarLocation {
  location?: string | null;
  city?: string | null;
  region?: string | null;
  description?: string | null;
}

const clean = (value: string) => value.replace(/[*_\u200b\ufeff]/g, "").trim().replace(/[;,.]+$/, "").trim();
const key = (value: string) => clean(value).toLocaleLowerCase("uk").replace(/\s+(?:область|обл\.?)$/, "").trim();

/** Enrich calendar locations without changing the stored start or calendar record. */
export function calendarLocation(input: CalendarLocation): string | null {
  const text = (input.description ?? "").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]*>/g, "").replace(/[*_\u200b\ufeff]/g, "");
  const field = (label: string) => {
    const match = text.match(new RegExp(`(?:^|\\n)[^\\p{L}\\p{N}\\n]*${label}\\s*[:—-]\\s*([^\\n]+)`, "iu"));
    return match ? clean(match[1]) : "";
  };
  const venue = field("(?:Де|Місце проведення|Локація)");
  const labeledCity = field("Місто").split(/\s+(?:або|чи)\s+/i)[0];
  const cityParts = (labeledCity || input.city || "").split(",").map(clean).filter(Boolean);
  const locationParts = (input.location ?? "").split(",").map(clean).filter(Boolean);
  const region = field("Область") || input.region || "";
  const parts = [...cityParts, ...locationParts];
  const regionPart = region || parts.find((part) => /\s(?:область|обл\.?)$/i.test(part)) || "";
  const base = parts.filter((part) => key(part) !== key(regionPart) && (!venue || key(venue) !== key(part)));
  const result: string[] = [];
  for (const part of [...base, regionPart, venue]) {
    const value = clean(part);
    if (!value || result.some((existing) => key(existing) === key(value))) continue;
    result.push(value);
  }
  return result.join(", ") || null;
}