// Shared, cross-view item selectors and helpers. Date helpers live in
// lib/dates.ts; view-specific derivations (review cards, task rows, history
// groups) live in each view's *.utils.ts.
// Path: view *.utils.ts files, sidebar-nav.tsx, completion-card.tsx →
// [this file] (leaf — pure functions, no network).
import type { ActionItem } from "@/domain/items/items.types";
import { LOW_CONFIDENCE_THRESHOLD } from "@/domain/items/items.constants";

/** Two-letter initials for an avatar badge; "?" for the Unassigned owner.
 * Used by tasks.utils.ts. */
export function initials(owner: string): string {
  if (owner === "Unassigned") return "?";
  const parts = owner.split(" ");
  return parts[0][0] + (parts[1] ? parts[1][0] : "");
}

/** True when the AI's confidence score is below the review threshold.
 * Used by review.utils.ts to flag cards for a closer look. */
export function isLow(
  item: ActionItem,
  threshold = LOW_CONFIDENCE_THRESHOLD,
): boolean {
  return item.confidence < threshold;
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
  flagCount: number;
}

/** Drives the sidebar completion widget and the Review nav badge. */
export function summary(
  items: ActionItem[],
  threshold = LOW_CONFIDENCE_THRESHOLD,
): Summary {
  const done = doneItems(items);
  const open = openItems(items);
  const total = items.length;
  return {
    donePct: total ? Math.round((done.length / total) * 100) + "%" : "0%",
    doneCount: done.length,
    openCount: open.length,
    // The Review nav badge counts only items still awaiting review.
    flagCount: pendingItems(items).filter((i) => isLow(i, threshold)).length,
  };
}
