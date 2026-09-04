// TanStack Query hooks — the app's window onto server state. Reads are
// cached per view (review list, keyset pages, counts, detail); writes are
// OPTIMISTIC where speed is felt (Review, the modal, tasks rows) and settle by
// invalidating the paginated lists — pages refetch instead of being
// surgically patched. Path §1 [hop 3/15]: → items.api.ts (hop 4).
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
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
  type ItemsPageVM,
} from "./items.api";
import {
  applyPatch,
  findInPages,
  markAllSaved,
  patchPages,
  removeItem,
} from "./items.cache";
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

/** A cached copy of an item from review or any page cache, stamped with its
 * source's fetch time so staleness carries over instead of resetting. */
function findCachedItem(
  queryClient: QueryClient,
  id: number,
): { item: ActionItem; updatedAt: number } | undefined {
  const review = queryClient.getQueryData<ActionItem[]>(itemsKey.review);
  const fromReview = review?.find((item) => item.id === id);
  if (fromReview) {
    return {
      item: fromReview,
      updatedAt: queryClient.getQueryState(itemsKey.review)?.dataUpdatedAt ?? 0,
    };
  }
  for (const prefix of [itemsKey.tasksAll, itemsKey.historyAll]) {
    for (const [key, data] of queryClient.getQueriesData<
      InfiniteData<ItemsPageVM>
    >({ queryKey: prefix })) {
      const item = findInPages(data, id);
      if (item) {
        return {
          item,
          updatedAt: queryClient.getQueryState(key)?.dataUpdatedAt ?? 0,
        };
      }
    }
  }
  return undefined;
}

/** One item for the detail modal; starts from the row's cached copy (a fresh
 * page means zero fetches on open) and only hits the API once that's stale. */
export function useItemQuery(id: number | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: itemsKey.detail(id ?? -1),
    queryFn: () => fetchItem(id as number),
    enabled: id !== null,
    initialData: () =>
      id === null ? undefined : findCachedItem(queryClient, id)?.item,
    initialDataUpdatedAt: () =>
      id === null ? undefined : findCachedItem(queryClient, id)?.updatedAt,
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

/** Settle a write: item caches (pages, counts, review, detail) refetch —
 * membership and order are the server's call. `keepDetailId` skips one detail
 * entry a PATCH already reconciled from its response, so an open modal isn't
 * refetched with data it was just handed. */
function settleItems(queryClient: QueryClient, keepDetailId?: number) {
  void queryClient.invalidateQueries({
    queryKey: itemsKey.all,
    predicate: (query) =>
      keepDetailId === undefined ||
      !(query.queryKey[1] === "detail" && query.queryKey[2] === keepDetailId),
  });
}

/** Patch an item in place across every cached tasks/history page — state flips
 * instantly; position corrects when the settle-time refetch lands. */
function patchPageCaches(
  queryClient: QueryClient,
  id: number,
  patch: ItemPatch,
) {
  for (const prefix of [itemsKey.tasksAll, itemsKey.historyAll]) {
    queryClient.setQueriesData<InfiniteData<ItemsPageVM>>(
      { queryKey: prefix },
      (data) => (data ? patchPages(data, id, patch) : data),
    );
  }
}

/**
 * PATCH one item. Optimistic on the Review cache, the modal's detail cache,
 * and in place across tasks/history pages; membership/order settle by refetch.
 * Meetings: only detail payloads carry item state, so only those invalidate.
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
      patchPageCaches(queryClient, id, patch);
      return snapshot;
    },
    onSuccess: (serverItem) => {
      // The server's copy is the truth (it stamps `completed`).
      queryClient.setQueryData(itemsKey.detail(serverItem.id), serverItem);
    },
    onError: (_error, _vars, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't save the change — reverted."),
    // On success the reconciled detail is already truth — keep it; on error
    // it holds the failed optimistic guess, so let the refetch heal it too.
    onSettled: (_data, error, { id }) => {
      settleItems(queryClient, error ? undefined : id);
      void queryClient.invalidateQueries({ queryKey: meetingsKey.detailAll });
    },
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
    onError: (_error, _id, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't delete the item — restored."),
    // Deletes change Meeting.itemCount, so every meetings shape refetches.
    onSettled: () => {
      settleItems(queryClient);
      void queryClient.invalidateQueries({ queryKey: meetingsKey.all });
    },
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
    // Saved flags change item state, not counts: meetings detail only.
    onSettled: () => {
      settleItems(queryClient);
      void queryClient.invalidateQueries({ queryKey: meetingsKey.detailAll });
    },
  });
}
