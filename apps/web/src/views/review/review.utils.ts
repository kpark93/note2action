/** Pure view-model builders for the Review screen — no network, no state;
 * shapes and styles raw items from useItemsQuery. */
import type { ActionItem } from "@/domain/items/items.types";
import { LOW_CONFIDENCE_THRESHOLD } from "@/domain/items/items.constants";
import { isLow, pendingItems } from "@/domain/items/items.utils";

/** Card styling for a review item, keyed on whether it's low-confidence. */
export function reviewStyle(low: boolean) {
  return {
    cardBorder: low ? "hsl(var(--primary) / 0.45)" : "hsl(var(--border))",
    cardShadow: low ? "0 10px 30px hsl(var(--primary) / 0.16)" : "none",
    hoverShadow: low
      ? "0 16px 38px hsl(var(--primary) / 0.26)"
      : "0 12px 30px hsl(0 0% 0% / 0.35)",
    hoverBorder: low
      ? "hsl(var(--primary) / 0.65)"
      : "hsl(var(--foreground) / 0.18)",
    noteFg: low ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
  };
}

export interface ReviewItemVM extends ActionItem {
  low: boolean;
  pct: string;
  /** Staggered entrance delay, e.g. "120ms". */
  delay: string;
}

/** Extracted-but-unsaved items (the Review queue), tagged with display fields. */
export function reviewItems(
  items: ActionItem[],
  threshold = LOW_CONFIDENCE_THRESHOLD,
): ReviewItemVM[] {
  return pendingItems(items).map((it, idx) => ({
    ...it,
    low: isLow(it, threshold),
    pct: it.confidence + "%",
    delay: idx * 40 + "ms",
  }));
}

/** The header's summary line, e.g. "3 items were low confidence…". */
export function flagSentence(flagCount: number): string {
  return flagCount
    ? `${flagCount} items were low confidence and are flagged below.`
    : "Everything came through with high confidence.";
}
