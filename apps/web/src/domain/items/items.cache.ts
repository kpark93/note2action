/** Pure transforms for optimistic updates — each mirrors a server rule, applied
 * to the cache before the server answers; the mutation hooks roll back on failure. */
import { todayISO } from "@/lib/dates";
import type { ItemSummary } from "@note2action/shared";
import type { ItemPatch } from "./items.api";
import type { ActionItem } from "./items.types";

/** One item edited in place — mirrors the server rule: Done ⟺ completed stamped. */
export function applyPatch(
  items: ActionItem[],
  id: number,
  patch: ItemPatch,
): ActionItem[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    const { note, ...rest } = patch;
    const next: ActionItem = { ...item, ...rest };
    if (note !== undefined) next.note = note ?? undefined;
    if (patch.status !== undefined) {
      next.completed = patch.status === "Done" ? todayISO() : null;
    }
    return next;
  });
}

/** applyPatch lifted over infinite pages — state updates in place; position
 * stays stale until the settle-time refetch reorders it (server's call). */
export function patchPages<P extends { items: ActionItem[] }>(
  data: { pages: P[]; pageParams: unknown[] },
  id: number,
  patch: ItemPatch,
): { pages: P[]; pageParams: unknown[] } {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: applyPatch(page.items, id, patch),
    })),
  };
}

/** Which summary buckets one item occupies — mirrors count_summary's SQL
 * FILTER clauses (onTime: undated counts as on time). */
function buckets(item: ActionItem) {
  const done = item.status === "Done";
  return {
    done: done ? 1 : 0,
    open: done ? 0 : 1,
    review: !done && !item.saved ? 1 : 0,
    onTime:
      done && (item.due == null || (item.completed ?? "") <= item.due) ? 1 : 0,
  };
}

/** Summary counts after one item moves from `before` to `after` (null =
 * deleted) — the optimistic twin of the server's aggregate query. */
export function applySummaryDelta(
  summary: ItemSummary,
  before: ActionItem,
  after: ActionItem | null,
): ItemSummary {
  const b = buckets(before);
  const a = after ? buckets(after) : { done: 0, open: 0, review: 0, onTime: 0 };
  return {
    ...summary,
    done: summary.done - b.done + a.done,
    open: summary.open - b.open + a.open,
    review: summary.review - b.review + a.review,
    onTime: summary.onTime - b.onTime + a.onTime,
    total: summary.total - 1 + (after ? 1 : 0),
  };
}

/** Mirrors the batch rule: every pending item saves, so Review empties. */
export function summaryAfterSaveAll(summary: ItemSummary): ItemSummary {
  return { ...summary, review: 0 };
}

export interface SettleKeep {
  /** Detail entry a PATCH response already reconciled. */
  detailId?: number;
  /** Summary already shifted by delta. */
  summary?: boolean;
  /** Non-Done ↔ non-Done status-only patch: membership can only change in
   * status-filtered tasks walks. SAFE ONLY while tasks order ignores status
   * (it's due-date order) — revisit if ordering ever becomes status-aware. */
  statusOnly?: boolean;
}

/** Whether one item cache key survives a write's settle-time invalidation —
 * true = already made true client-side, skip the refetch. */
export function keptOnSettle(
  key: readonly unknown[],
  keep: SettleKeep,
): boolean {
  const kind = key[1];
  if (kind === "detail") return key[2] === keep.detailId;
  if (kind === "summary") return keep.summary === true;
  if (!keep.statusOnly) return false;
  if (kind === "review" || kind === "history") return true;
  // ["items", "tasks", owner, status, priority] — key[3] is the status filter.
  return kind === "tasks" && key[3] === "All";
}

/** First copy of an item found across a pages structure, or undefined —
 * lets the detail query start from cache instead of fetching. */
export function findInPages<P extends { items: ActionItem[] }>(
  data: { pages: P[] } | undefined,
  id: number,
): ActionItem | undefined {
  for (const page of data?.pages ?? []) {
    const hit = page.items.find((item) => item.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/** Drop one item from the cache. Used by useDeleteItem's optimistic update. */
export function removeItem(items: ActionItem[], id: number): ActionItem[] {
  return items.filter((item) => item.id !== id);
}

/** Mirrors the server's batch rule: only pending (unsaved, not Done) items. */
export function markAllSaved(items: ActionItem[]): ActionItem[] {
  return items.map((item) =>
    !item.saved && item.status !== "Done" ? { ...item, saved: true } : item,
  );
}
