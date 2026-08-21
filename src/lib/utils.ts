import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const eventCity = (location: string | null) => {
  const loc = (location ?? "").trim();
  if (!loc) return "";
  const beforeComma = loc.split(",")[0].trim();
  const parts = beforeComma.split(/\.\s*/).map((p) => p.trim()).filter(Boolean);
  const mIdx = parts.findIndex((p) => /^м\.?$/i.test(p));
  if (mIdx >= 0 && parts[mIdx + 1]) return parts[mIdx + 1];
  const noRegion = parts.filter((p) => !/обл\.?$/i.test(p) && !/^область$/i.test(p));
  return noRegion[0] ?? "";
};

