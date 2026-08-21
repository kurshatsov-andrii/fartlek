import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const eventCity = (location: string | null) => {
  const raw = (location ?? "").trim();
  if (!raw) return "";

  // Online is a format label, not a city
  if (/^онлайн$/i.test(raw)) return "Онлайн";

  // Special case: "35 км від Кременчука (на горі)" -> "Кременчук"
  const fromMatch = raw.match(/(?:\d+\s*(?:км|км\.|km|km\.)\s*)?від\s+([А-Яа-яІЇЄҐ'’\s-]+)/i);
  if (fromMatch) {
    const candidate = fromMatch[1].split(/[\s,(]/)[0].trim().toLowerCase();
    const caseFix: Record<string, string> = {
      кременчука: "Кременчук",
    };
    if (caseFix[candidate]) return caseFix[candidate];
    return candidate.charAt(0).toUpperCase() + candidate.slice(1);
  }

  // Drop region/area after comma
  let loc = raw.split(",")[0].trim();

  // Split on period
  const parts = loc.split(/\.\s*/).map((p) => p.trim()).filter(Boolean);

  // Strip prefixes like "місто", "м.", "село", "с." and region suffixes
  const prefixRe = /^(місто|м\.|село|с\.|смт|селище|селище міського типу)\s*/i;
  const city = parts
    .map((p) => p.replace(prefixRe, "").trim())
    .filter(
      (p) =>
        p &&
        !/область|обл\b|район|р-н/i.test(p) &&
        !/^(місто|м\.|село|с\.|смт|селище)$/i.test(p)
    )[0] ?? "";

  if (!city) return "";

  // Normalize case for known city names that appear in oblique cases
  const caseFix: Record<string, string> = {
    валки: "Валки",
    тисовець: "Тисовець",
  };
  const lower = city.toLowerCase();
  if (caseFix[lower]) return caseFix[lower];

  return city;
};

