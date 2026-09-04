/** Pure transforms for optimistic updates — each mirrors a server rule, applied
 * to the cache before the server answers; the mutation hooks roll back on failure. */
import { todayISO } from "@/lib/dates";
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
