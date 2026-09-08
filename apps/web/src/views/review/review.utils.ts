/** Pure view-model builders for the Review screen — the server's view=review
 * already returns exactly the pending queue; this only adds display fields. */
import type { ActionItem } from "@/domain/items/items.types";

export interface ReviewItemVM extends ActionItem {
  /** Staggered entrance delay, e.g. "90ms" — capped so it never grows. */
  delay: string;
}

/** The pending queue, tagged with display fields. */
export function reviewItems(items: ActionItem[]): ReviewItemVM[] {
  return items.map((it, idx) => ({
    ...it,
    delay: Math.min(idx, 8) * 30 + "ms",
  }));
}

/** The header's summary line, e.g. "3 items waiting for review." */
export function reviewSentence(count: number): string {
  if (count === 0) return "Review queue is empty.";
  return count === 1
    ? "1 item waiting for review."
    : `${count} items waiting for review.`;
}
