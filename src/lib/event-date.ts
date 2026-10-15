// Registration must never be offered for an event whose date has already passed.
// Dates are stored as ISO "YYYY-MM-DD" strings, so a plain string compare works.
export function isPastDate(dateStr: string | null | undefined, today: string = new Date().toISOString().slice(0, 10)): boolean {
  if (!dateStr) return false;
  return dateStr < today;
}
