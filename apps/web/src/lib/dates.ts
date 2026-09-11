/** Date formatting and comparison helpers — leaf, no network. */

/** "Aug 14", or "—" for an empty date. */
export function formatDate(d: string): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** A Date's local calendar day as "YYYY-MM-DD" — never toISOString (UTC's calendar). */
function localDayISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "Aug 14" for an ISO timestamp — the instant's day on the viewer's calendar. */
export function formatInstantDate(iso: string): string {
  return formatDate(localDayISO(new Date(iso)));
}

/** Today's date as an ISO day string in the viewer's timezone. */
export function todayISO(): string {
  return localDayISO(new Date());
}

/** ISO date of the Monday that starts the week containing `d`. */
export function weekOf(d: string): string {
  const t = new Date(d + "T00:00:00");
  const monday = new Date(t);
  monday.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return localDayISO(monday);
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
