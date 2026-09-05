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
  applySummaryDelta,
  findInPages,
  keptOnSettle,
  markAllSaved,
  patchPages,
  removeItem,
  summaryAfterSaveAll,
  type SettleKeep,
} from "./items.cache";
import type { ItemSummary } from "@note2action/shared";
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
  /** True when the summary was adjusted by delta — settle keeps it then. */
  summaryAdjusted?: boolean;
  /** The item's status before the patch; undefined = wasn't cached. */
  beforeStatus?: ActionItem["status"];
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

/** Settle a write: item caches refetch — membership and order are the
 * server's call. `keep` (items.cache.ts keptOnSettle) skips entries already
 * made true client-side; they still heal on natural staleness. */
function settleItems(queryClient: QueryClient, keep?: SettleKeep) {
  void queryClient.invalidateQueries({
    queryKey: itemsKey.all,
    predicate: (query) => !keptOnSettle(query.queryKey, keep ?? {}),
  });
}

/** Optimistically shift the summary counts for one item's change; returns
 * false (→ settle refetches instead) when the prior state isn't cached. */
function adjustSummary(
  queryClient: QueryClient,
  before: ActionItem | undefined,
  after: (before: ActionItem) => ActionItem | null,
): boolean {
  if (!before) return false;
  queryClient.setQueryData<ItemSummary>(itemsKey.summary, (summary) =>
    summary ? applySummaryDelta(summary, before, after(before)) : summary,
  );
  return true;
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
      const before = findCachedItem(queryClient, id)?.item;
      const snapshot = await optimistically(queryClient, (items) =>
        applyPatch(items, id, patch),
      );
      queryClient.setQueryData<ActionItem>(itemsKey.detail(id), (item) =>
        item ? applyPatch([item], id, patch)[0] : item,
      );
      patchPageCaches(queryClient, id, patch);
      snapshot.summaryAdjusted = adjustSummary(
        queryClient,
        before,
        (b) => applyPatch([b], id, patch)[0],
      );
      snapshot.beforeStatus = before?.status;
      return snapshot;
    },
    onSuccess: (serverItem) => {
      // The server's copy is the truth (it stamps `completed`).
      queryClient.setQueryData(itemsKey.detail(serverItem.id), serverItem);
    },
    onError: (_error, _vars, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't save the change — reverted."),
    // On success the reconciled detail and delta'd summary are already
    // truth — keep both; a status-only change between non-Done states also
    // keeps every walk it can't have moved the item in or out of. On error
    // the refetch heals everything.
    onSettled: (_data, error, { id, patch }, snapshot) => {
      const statusOnly =
        Object.keys(patch).length === 1 &&
        patch.status !== undefined &&
        patch.status !== "Done" &&
        snapshot?.beforeStatus !== undefined &&
        snapshot.beforeStatus !== "Done";
      settleItems(
        queryClient,
        error
          ? undefined
          : {
              detailId: id,
              summary: snapshot?.summaryAdjusted,
              statusOnly,
            },
      );
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
    onMutate: async (id) => {
      const before = findCachedItem(queryClient, id)?.item;
      const snapshot = await optimistically(queryClient, (items) =>
        removeItem(items, id),
      );
      snapshot.summaryAdjusted = adjustSummary(queryClient, before, () => null);
      return snapshot;
    },
    onError: (_error, _id, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't delete the item — restored."),
    // Deletes change Meeting.itemCount, so every meetings shape refetches.
    onSettled: (_data, error, _id, snapshot) => {
      settleItems(
        queryClient,
        error ? undefined : { summary: snapshot?.summaryAdjusted },
      );
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
    onMutate: async () => {
      const snapshot = await optimistically(queryClient, markAllSaved);
      // The batch rule needs no per-item lookup: Review always empties.
      queryClient.setQueryData<ItemSummary>(itemsKey.summary, (summary) =>
        summary ? summaryAfterSaveAll(summary) : summary,
      );
      snapshot.summaryAdjusted = true;
      return snapshot;
    },
    onError: (_error, _vars, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't save to Tasks — reverted."),
    // Saved flags change item state, not counts: meetings detail only.
    onSettled: (_data, error, _vars, snapshot) => {
      settleItems(
        queryClient,
        error ? undefined : { summary: snapshot?.summaryAdjusted },
      );
      void queryClient.invalidateQueries({ queryKey: meetingsKey.detailAll });
    },
  });
}
