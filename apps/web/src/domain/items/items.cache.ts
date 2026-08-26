// Pure transforms for optimistic updates: each mirrors a server-side rule,
// applied to the TanStack cache before the server has answered. If the
// server later disagrees, the mutation hooks roll the cache back.
// Path: items.queries.ts (onMutate) → [this file]. (request-paths.md §2)
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
