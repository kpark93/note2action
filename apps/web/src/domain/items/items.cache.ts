/** Pure optimistic-update transforms — each mirrors a server rule; hooks roll back. */
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

/** applyPatch over pages — state updates in place; the settle refetch reorders. */
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

/** removeItem over pages — stored cursors stay valid: keyset WHEREs are anchor-free. */
export function removeFromPages<P extends { items: ActionItem[] }>(
  data: { pages: P[]; pageParams: unknown[] },
  id: number,
): { pages: P[]; pageParams: unknown[] } {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: removeItem(page.items, id),
    })),
  };
}

/** Which summary buckets one item occupies — mirrors count_summary's FILTERs. */
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

/** Summary counts after one item moves before → after (null = deleted). */
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

/** Mirrors a capture: n items born open + unsaved, one meeting joins the count. */
export function summaryAfterCapture(
  summary: ItemSummary,
  newItems: number,
): ItemSummary {
  return {
    ...summary,
    total: summary.total + newItems,
    open: summary.open + newItems,
    review: summary.review + newItems,
    meetings: summary.meetings + 1,
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
  /** Status-only non-Done patch; SAFE ONLY while tasks order ignores status. */
  statusOnly?: boolean;
  /** Review already true client-side; SAFE ONLY while review is id-ordered. */
  review?: boolean;
  /** Reopen whose History removal already applied — the exit happened client-side. */
  history?: boolean;
  /** Send-back whose tasks removal applied — saved:false exits every walk. */
  tasks?: boolean;
}

/** Whether a cache key survives settle — true = already correct, skip the refetch. */
export function keptOnSettle(
  key: readonly unknown[],
  keep: SettleKeep,
): boolean {
  const kind = key[1];
  if (kind === "detail") return key[2] === keep.detailId;
  if (kind === "summary") return keep.summary === true;
  if (kind === "review") {
    return keep.review === true || keep.statusOnly === true;
  }
  if (kind === "history") {
    return keep.history === true || keep.statusOnly === true;
  }
  // ["items", "tasks", status, priority] — key[2] is the status filter.
  return (
    kind === "tasks" &&
    (keep.tasks === true || (keep.statusOnly === true && key[2] === "All"))
  );
}

/** First copy of an item across pages, or undefined — seeds the detail query. */
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

/** Insert at the id-order slot (mirrors list_review); no-op if present or non-member. */
export function insertByIdOrder(
  items: ActionItem[],
  item: ActionItem,
): ActionItem[] {
  if (item.saved || item.status === "Done") return items;
  if (items.some((existing) => existing.id === item.id)) return items;
  const at = items.findIndex((existing) => existing.id > item.id);
  return at === -1
    ? [...items, item]
    : [...items.slice(0, at), item, ...items.slice(at)];
}

/** Mirrors the batch rule: every unsaved open item saves and leaves Review. */
export function clearPending(items: ActionItem[]): ActionItem[] {
  return items.filter((item) => item.saved || item.status === "Done");
}
