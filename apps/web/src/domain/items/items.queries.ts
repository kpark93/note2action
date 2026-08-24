// TanStack Query hooks — the app's window onto server state. Reads are
// cached; writes are OPTIMISTIC: instant cache update, reconciled with
// the server, or rolled back + toasted on failure.
// Path §1 [hop 3/15]: → items.api.ts (hop 4). (request-paths.md §1, §2)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { itemsKey, meetingsKey } from "@/lib/query-keys";
import {
  deleteItem,
  fetchItems,
  patchItem,
  saveAllToTasks,
  type ItemPatch,
} from "./items.api";
import { applyPatch, markAllSaved, removeItem } from "./items.cache";
import type { ActionItem } from "./items.types";

/**
 * Full items list, cached by TanStack Query. Fires GET /api/items via
 * items.api.ts fetchItems; every other view shares this one cache entry.
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

/** Restore the snapshot, then refetch — if the write already landed before
 * the error, the refetch heals the cache back to the database's truth. */
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
 * PATCH one item. Optimistic: items.cache.ts updates the cache instantly;
 * items.api.ts patchItem's response reconciles it, or rolls back + toasts.
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
 * Delete one item. Optimistic: items.cache.ts drops it instantly; a
 * failed items.api.ts deleteItem call restores it and shows a toast.
 */
export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onMutate: (id) =>
      optimistically(queryClient, (items) => removeItem(items, id)),
    // A delete changes the meetings' itemCounts too.
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: meetingsKey.all }),
    onError: (_error, _id, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't delete the item — restored."),
  });
}

/**
 * "Save N to Tasks": optimistic — items.cache.ts flips the cache instantly;
 * items.api.ts saveAllToTasks settles it via a reconciling GET /api/items.
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
