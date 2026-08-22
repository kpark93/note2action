// Date formatting and comparison helpers. Used across the items domain
// (items.cache.ts) and most view *.utils.ts / *.view.tsx files that render
// or sort dates.
// Path: items.cache.ts, view files → [this file] (leaf — no network).

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

/** Relative day label for an ISO timestamp: "today", "1d ago", "12d ago". */
export function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : `${days}d ago`;
}

/** Sort comparator for ISO date strings: earliest first; empty dates sort last. */
export function compareDueAsc(a: string, b: string): number {
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return a.localeCompare(b);
}
