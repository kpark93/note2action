/** Pure view-model builders for the Tasks screen — filtering and sorting
 * moved server-side (view=tasks keyset); this only shapes rows for display. */
import type { ActionItem } from "@/domain/items/items.types";
import { initials } from "@/domain/items/items.utils";
import { formatDate } from "@/lib/dates";

export interface TaskRowVM extends ActionItem {
  initials: string;
  /** Formatted due date, e.g. "Aug 14", or "—" when none. */
  dueLabel: string;
  /** Staggered entrance delay, e.g. "90ms" — capped (~240ms span) so the
   * cascade stays visible but never grows with list length. */
  delay: string;
}

/** Server-ordered items → display rows. No filtering, no sorting here. */
export function taskRows(items: ActionItem[]): TaskRowVM[] {
  return items.map((it, idx) => ({
    ...it,
    initials: initials(it.owner),
    dueLabel: formatDate(it.due),
    delay: Math.min(idx, 8) * 30 + "ms",
  }));
}
