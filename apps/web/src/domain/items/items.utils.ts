/** Shared cross-view item selectors; view-specific derivations live in each
 * view's own *.utils.ts. Leaf — no network. */
import type { ActionItem } from "@/domain/items/items.types";

/** Two-letter initials for an avatar badge; "?" for the Unassigned owner.
 * Used by tasks.utils.ts. */
export function initials(owner: string): string {
  if (owner === "Unassigned") return "?";
  const parts = owner.split(" ");
  return parts[0][0] + (parts[1] ? parts[1][0] : "");
}

/** Items not yet marked Done. Used by history.utils.ts. */
export const openItems = (items: ActionItem[]) =>
  items.filter((i) => i.status !== "Done");

/** Items marked Done. Used by history.utils.ts. */
export const doneItems = (items: ActionItem[]) =>
  items.filter((i) => i.status === "Done");

/** Extracted but not yet saved — the Review queue. */
export const pendingItems = (items: ActionItem[]) =>
  items.filter((i) => i.status !== "Done" && !i.saved);

/** Saved and still open — the Tasks list (accumulates across saves). */
export const savedTasks = (items: ActionItem[]) =>
  items.filter((i) => i.status !== "Done" && i.saved);

export interface Summary {
  donePct: string;
  doneCount: number;
  openCount: number;
  reviewCount: number;
}

/** Drives the sidebar completion widget and the Review nav badge. */
export function summary(items: ActionItem[]): Summary {
  const done = doneItems(items);
  const open = openItems(items);
  const total = items.length;
  return {
    donePct: total ? Math.round((done.length / total) * 100) + "%" : "0%",
    doneCount: done.length,
    openCount: open.length,
    // The Review nav badge counts every item still awaiting review.
    reviewCount: pendingItems(items).length,
  };
}
