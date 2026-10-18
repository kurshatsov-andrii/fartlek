// Registration must never be offered for an event whose date has already passed.
// Dates are stored as ISO "YYYY-MM-DD" strings, so a plain string compare works.
export function isPastDate(dateStr: string | null | undefined, today: string = new Date().toISOString().slice(0, 10)): boolean {
  if (!dateStr) return false;
  return dateStr < today;
}

// Owner rule: a start counts as finished from the day before its date —
// the card moves to "Завершені" and registration UI disappears one day early.
export function isCompletedDate(dateStr: string | null | undefined, today: string = new Date().toISOString().slice(0, 10)): boolean {
  if (!dateStr) return false;
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() + 1);
  return dateStr <= cutoff.toISOString().slice(0, 10);
}
