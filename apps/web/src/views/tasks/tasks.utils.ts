/** Pure view-model builders for the Tasks screen — filtering and sorting
 * moved server-side (view=tasks keyset); this only shapes rows for display. */
import type { ActionItem, Status } from "@/domain/items/items.types";
import { initials } from "@/domain/items/items.utils";
import { formatDate } from "@/lib/dates";

/** Colors for each status pill, keyed to match the Select trigger's chrome. */
export const STATUS_STYLE: Record<
  Status,
  { bg: string; fg: string; border: string }
> = {
  "Not started": {
    bg: "hsl(var(--foreground) / 0.06)",
    fg: "hsl(var(--muted-foreground))",
    border: "hsl(var(--foreground) / 0.14)",
  },
  "In progress": {
    bg: "hsl(var(--primary) / 0.24)",
    fg: "hsl(var(--pill-blue))",
    border: "hsl(var(--primary) / 0.45)",
  },
  Blocked: {
    bg: "hsl(var(--magenta) / 0.16)",
    fg: "hsl(var(--pill-magenta))",
    border: "hsl(var(--magenta) / 0.4)",
  },
  Done: {
    bg: "hsl(var(--foreground) / 0.1)",
    fg: "hsl(var(--foreground))",
    border: "hsl(var(--foreground) / 0.2)",
  },
};

export interface TaskRowVM extends ActionItem {
  initials: string;
  /** Formatted due date, e.g. "Aug 14", or "—" when none. */
  dueLabel: string;
  /** Staggered entrance delay, e.g. "105ms" — capped so late pages of an
   * infinite scroll don't wait seconds to appear. */
  delay: string;
}

/** Server-ordered items → display rows. No filtering, no sorting here. */
export function taskRows(items: ActionItem[]): TaskRowVM[] {
  return items.map((it, idx) => ({
    ...it,
    initials: initials(it.owner),
    dueLabel: formatDate(it.due),
    delay: Math.min(idx, 12) * 35 + "ms",
  }));
}
