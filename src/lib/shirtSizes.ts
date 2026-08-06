export interface ShirtSize {
  label: string;
  measures: string; // довжина/ширина (A/B), см
}

export const WOMEN_SHIRT_SIZES: ShirtSize[] = [
  { label: "S", measures: "62/42" },
  { label: "M", measures: "64/45" },
  { label: "L", measures: "66/48" },
  { label: "XL", measures: "68/51" },
  { label: "2XL", measures: "70/54" },
];

export const MEN_SHIRT_SIZES: ShirtSize[] = [
  { label: "S", measures: "64/48" },
  { label: "M", measures: "71/51" },
  { label: "L", measures: "72/54" },
  { label: "XL", measures: "73/57" },
  { label: "2XL", measures: "74/60" },
  { label: "3XL", measures: "75/63" },
];

export const getShirtSizes = (gender: string): ShirtSize[] =>
  gender === "female" || gender === "girl" ? WOMEN_SHIRT_SIZES : MEN_SHIRT_SIZES;

/**
 * Український ІПН (РНОКПП): 10 цифр, перші 5 — кількість днів від 31.12.1899
 * до дати народження.
 */
export const taxIdBirthDate = (taxId: string): string | null => {
  const digits = taxId.replace(/\D/g, "");
  if (digits.length !== 10) return null;
  const days = parseInt(digits.slice(0, 5), 10);
  if (!days) return null;
  const base = Date.UTC(1899, 11, 31);
  const d = new Date(base + days * 86400000);
  return d.toISOString().slice(0, 10);
};

export const validateTaxId = (
  taxId: string,
  birthDate: string
): { ok: true } | { ok: false; error: "format" | "birthDate" } => {
  const digits = taxId.replace(/\D/g, "");
  if (!/^\d{10}$/.test(digits)) return { ok: false, error: "format" };
  const encoded = taxIdBirthDate(digits);
  if (birthDate && encoded && encoded !== birthDate) {
    return { ok: false, error: "birthDate" };
  }
  return { ok: true };
};
