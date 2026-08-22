// TanStack Query hooks — the app's window onto server state.
//
// Reads are cached; writes are OPTIMISTIC (apply the change to the local
// cache immediately, before the server confirms it), then reconciled with
// the server's answer — or rolled back with a toast if the server refuses.
// Path §1 [hop 3/15]: views (hop 2) → [this file] → items.api.ts (hop 4).
// Return trip: [hop 15] — parsed items land in the cache; views rerender.
// (request-paths.md §1 read, §2 optimistic write)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { meetingsKey } from "@/domain/meetings/meetings.queries";
import {
  deleteItem,
  fetchItems,
  patchItem,
  saveAllToTasks,
  type ItemPatch,
} from "./items.api";
import { applyPatch, markAllSaved, removeItem } from "./items.cache";
import type { ActionItem } from "./items.types";

export const itemsKey = ["items"] as const;

/**
 * The full items list, cached by TanStack Query. Fires GET /api/items
 * (items.api.ts fetchItems) on first mount; every other read in the app —
 * sidebar badges, Tasks, Review, History — shares this one cache entry
 * instead of refetching.
 */
export function useItemsQuery() {
  return useQuery({ queryKey: itemsKey, queryFn: fetchItems });
}

interface Snapshot {
  previous: ActionItem[] | undefined;
}

/** Cancel in-flight fetches (so they can't overwrite the optimistic state),
 * snapshot the cache for rollback, then apply the optimistic transform. */
async function optimistically(
  queryClient: QueryClient,
  transform: (items: ActionItem[]) => ActionItem[],
): Promise<Snapshot> {
  await queryClient.cancelQueries({ queryKey: itemsKey });
  const previous = queryClient.getQueryData<ActionItem[]>(itemsKey);
  if (previous) queryClient.setQueryData(itemsKey, transform(previous));
  return { previous };
}

/** Restore the snapshot, then refetch — if the write actually landed before
 * the error (e.g. a failure while building the response), the refetch heals
 * the cache back to the database's truth. */
function rollback(
  queryClient: QueryClient,
  snapshot: Snapshot | undefined,
  message: string,
) {
  if (snapshot?.previous) queryClient.setQueryData(itemsKey, snapshot.previous);
  void queryClient.invalidateQueries({ queryKey: itemsKey });
  toast.error(message);
}

/**
 * PATCH one item (title, owner, due, priority, status, note). Optimistic:
 * items.cache.ts applyPatch updates the cache immediately; the server's
 * response (items.api.ts patchItem) then overwrites that row so its
 * server-stamped `completed` date wins. Rolls back + toasts on failure.
 * Used by: review-card.tsx, task-row.tsx, tasks.view.tsx, history-row.tsx.
 */
export function usePatchItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: ItemPatch }) =>
      patchItem(id, patch),
    onMutate: ({ id, patch }) =>
      optimistically(queryClient, (items) => applyPatch(items, id, patch)),
    onSuccess: (serverItem) => {
      // Reconcile from the response instead of refetching the list — the
      // server's copy is the truth (it stamps `completed`).
      queryClient.setQueryData<ActionItem[]>(itemsKey, (items) =>
        items?.map((item) => (item.id === serverItem.id ? serverItem : item)),
      );
    },
    onError: (_error, _vars, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't save the change — reverted."),
  });
}

/**
 * Delete one item. Optimistic: items.cache.ts removeItem drops it from the
 * cache immediately; a failed DELETE restores it and toasts. On success,
 * also invalidates the meetings cache (its itemCounts changed).
 * Used by: review-card.tsx.
 */
export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onMutate: (id) =>
      optimistically(queryClient, (items) => removeItem(items, id)),
    // A delete changes the meetings' itemCounts too.
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: meetingsKey }),
    onError: (_error, _id, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't delete the item — restored."),
  });
}

/**
 * "Save N to Tasks" — batch-marks every pending Review item as saved.
 * Optimistic: the cache flips instantly (items.cache.ts markAllSaved); a
 * reconciling GET /api/items runs once the server settles, whether it
 * succeeded or failed.
 * Used by: review.view.tsx toolbar button.
 */
export function useSaveToTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAllToTasks,
    onMutate: () => optimistically(queryClient, markAllSaved),
    onError: (_error, _vars, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't save to Tasks — reverted."),
    // Batch write: reconcile against the server's count once it settles.
    onSettled: () => queryClient.invalidateQueries({ queryKey: itemsKey }),
  });
}
