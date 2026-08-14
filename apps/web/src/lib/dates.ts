// Date formatting and comparison helpers.

/** "Aug 14", or "—" for an empty date. */
export function formatDate(d: string): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Today's date as an ISO day string, e.g. "2026-08-14". */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO date of the Monday that starts the week containing `d`. */
export function weekOf(d: string): string {
  const t = new Date(d + "T00:00:00");
  const monday = new Date(t);
  monday.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

/** Sort comparator for ISO date strings: earliest first; empty dates sort last. */
export function compareDueAsc(a: string, b: string): number {
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return a.localeCompare(b);
}
