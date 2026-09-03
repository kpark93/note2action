// TanStack Query hooks — the app's window onto server state. Reads are
// cached per view (review list, keyset pages, counts, detail); writes are
// OPTIMISTIC where speed is felt (Review, the modal) and settle by
// invalidating the paginated lists — pages refetch instead of being
// surgically patched. Path §1 [hop 3/15]: → items.api.ts (hop 4).
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { itemsKey, meetingsKey } from "@/lib/query-keys";
import {
  deleteItem,
  fetchHistoryPage,
  fetchItem,
  fetchReviewItems,
  fetchSummary,
  fetchTasksPage,
  patchItem,
  saveAllToTasks,
  type ItemPatch,
} from "./items.api";
import { applyPatch, markAllSaved, removeItem } from "./items.cache";
import type { ActionItem } from "./items.types";

/** The Review queue — bounded (one capture's worth), so never paginated. */
export function useReviewQuery() {
  return useQuery({ queryKey: itemsKey.review, queryFn: fetchReviewItems });
}

/** Tasks pages. Filters live in the key: changing one starts a fresh walk. */
export function useTasksInfinite(
  owner: string,
  status: string,
  priority: string,
) {
  return useInfiniteQuery({
    queryKey: itemsKey.tasks(owner, status, priority),
    queryFn: ({ pageParam }) =>
      fetchTasksPage(owner, status, priority, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** History pages — Done items, newest-closed first. */
export function useHistoryInfinite(owner: string) {
  return useInfiniteQuery({
    queryKey: itemsKey.history(owner),
    queryFn: ({ pageParam }) => fetchHistoryPage(owner, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** Counts for the sidebar, Home, and History stats — no rows fetched. */
export function useSummaryQuery() {
  return useQuery({ queryKey: itemsKey.summary, queryFn: fetchSummary });
}

/** One item for the detail modal; only fires while the modal is open. */
export function useItemQuery(id: number | null) {
  return useQuery({
    queryKey: itemsKey.detail(id ?? -1),
    queryFn: () => fetchItem(id as number),
    enabled: id !== null,
  });
}

interface Snapshot {
  previous: ActionItem[] | undefined;
}

/** Cancel in-flight item fetches (so they can't overwrite the optimistic
 * state), snapshot the Review cache for rollback, apply the transform. */
async function optimistically(
  queryClient: QueryClient,
  transform: (items: ActionItem[]) => ActionItem[],
): Promise<Snapshot> {
  await queryClient.cancelQueries({ queryKey: itemsKey.all });
  const previous = queryClient.getQueryData<ActionItem[]>(itemsKey.review);
  if (previous) {
    queryClient.setQueryData(itemsKey.review, transform(previous));
  }
  return { previous };
}

/** Restore the snapshot and toast; the settle-time invalidate below heals
 * whatever the optimistic write touched with the database's truth. */
function rollback(
  queryClient: QueryClient,
  snapshot: Snapshot | undefined,
  message: string,
) {
  if (snapshot?.previous) {
    queryClient.setQueryData(itemsKey.review, snapshot.previous);
  }
  toast.error(message);
}

/** Every write settles the same way: all item caches (pages, counts, review,
 * detail) refetch — membership and order are the server's call now. */
function settleItems(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: itemsKey.all });
}

/**
 * PATCH one item. Optimistic on the Review cache and the modal's detail
 * cache; paginated lists refetch on settle.
 */
export function usePatchItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: ItemPatch }) =>
      patchItem(id, patch),
    onMutate: async ({ id, patch }) => {
      const snapshot = await optimistically(queryClient, (items) =>
        applyPatch(items, id, patch),
      );
      queryClient.setQueryData<ActionItem>(itemsKey.detail(id), (item) =>
        item ? applyPatch([item], id, patch)[0] : item,
      );
      return snapshot;
    },
    onSuccess: (serverItem) => {
      // The server's copy is the truth (it stamps `completed`).
      queryClient.setQueryData(itemsKey.detail(serverItem.id), serverItem);
    },
    onError: (_error, _vars, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't save the change — reverted."),
    onSettled: () => settleItems(queryClient),
  });
}

/**
 * Delete one item. Optimistic on the Review cache; a failed call restores
 * it and toasts. Meetings refetch too — itemCounts changed.
 */
export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onMutate: (id) =>
      optimistically(queryClient, (items) => removeItem(items, id)),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: meetingsKey.all }),
    onError: (_error, _id, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't delete the item — restored."),
    onSettled: () => settleItems(queryClient),
  });
}

/**
 * "Save N to Tasks": optimistic flip of the Review cache; the settle-time
 * invalidate brings the promoted rows into the Tasks pages.
 */
export function useSaveToTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAllToTasks,
    onMutate: () => optimistically(queryClient, markAllSaved),
    onError: (_error, _vars, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't save to Tasks — reverted."),
    onSettled: () => settleItems(queryClient),
  });
}
