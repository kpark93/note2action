/** Pure Tasks view-model builders — this only shapes rows; sorting is server-side. */
import type { ActionItem } from "@/domain/items/items.types";
import { initials } from "@/domain/items/items.utils";
import { formatDate } from "@/lib/dates";

export interface TaskRowVM extends ActionItem {
  initials: string;
  /** Formatted due date, e.g. "Aug 14", or "—" when none. */
  dueLabel: string;
  /** Staggered entrance delay, capped so the cascade never grows with list length. */
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
