/** Pure view-model builders for the Review screen — no network, no state;
 * shapes raw items from useItemsQuery. */
import type { ActionItem } from "@/domain/items/items.types";
import { pendingItems } from "@/domain/items/items.utils";

export interface ReviewItemVM extends ActionItem {
  /** Staggered entrance delay, e.g. "120ms". */
  delay: string;
}

/** Extracted-but-unsaved items (the Review queue), tagged with display fields. */
export function reviewItems(items: ActionItem[]): ReviewItemVM[] {
  return pendingItems(items).map((it, idx) => ({
    ...it,
    delay: idx * 40 + "ms",
  }));
}

/** The header's summary line, e.g. "3 items waiting for review." */
export function reviewSentence(count: number): string {
  if (count === 0) return "Review queue is empty.";
  return count === 1
    ? "1 item waiting for review."
    : `${count} items waiting for review.`;
}
