// TanStack Query hooks: reads cached per view; writes optimistic, settled by refetch.
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
  clearPending,
  findInPages,
  insertByIdOrder,
  keptOnSettle,
  patchPages,
  removeFromPages,
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
export function useTasksInfinite(status: string, priority: string) {
  return useInfiniteQuery({
    queryKey: itemsKey.tasks(status, priority),
    queryFn: ({ pageParam }) => fetchTasksPage(status, priority, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** History pages — Done items, newest-closed first. */
export function useHistoryInfinite() {
  return useInfiniteQuery({
    queryKey: itemsKey.history,
    queryFn: ({ pageParam }) => fetchHistoryPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** Counts for the sidebar, Home, and History stats — no rows fetched. */
export function useSummaryQuery() {
  return useQuery({ queryKey: itemsKey.summary, queryFn: fetchSummary });
}

/** Cached copy of an item from any list cache, stamped with its source's fetch time. */
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
  for (const prefix of [itemsKey.tasksAll, itemsKey.history]) {
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

/** Detail-modal item: seeded from the row's cached copy, fetched only once stale. */
export function useItemQuery(id: number) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: itemsKey.detail(id),
    queryFn: () => fetchItem(id),
    initialData: () => findCachedItem(queryClient, id)?.item,
    initialDataUpdatedAt: () => findCachedItem(queryClient, id)?.updatedAt,
  });
}

interface Snapshot {
  previous: ActionItem[] | undefined;
  /** True when the summary was adjusted by delta — settle keeps it then. */
  summaryAdjusted?: boolean;
  /** The item's status before the patch; undefined = wasn't cached. */
  beforeStatus?: ActionItem["status"];
  /** The item's saved flag before the patch; undefined = wasn't cached. */
  beforeSaved?: boolean;
  /** True when a send-back's Review insert was applied — settle keeps Review. */
  reviewAdjusted?: boolean;
  /** True when a reopen's History removal was applied — settle keeps History. */
  historyAdjusted?: boolean;
  /** True when a send-back's tasks removal was applied — settle keeps tasks. */
  tasksAdjusted?: boolean;
  /** Deleted item's meeting — only that meeting's detail goes stale. */
  meetingId?: number;
}

/** Cancel in-flight fetches, snapshot Review for rollback, apply the transform. */
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

/** Restore the snapshot and toast; the settle-time invalidate heals the rest. */
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

/** Settle a write: caches refetch; `keep` skips entries already true client-side. */
function settleItems(queryClient: QueryClient, keep?: SettleKeep) {
  void queryClient.invalidateQueries({
    queryKey: itemsKey.all,
    predicate: (query) => !keptOnSettle(query.queryKey, keep ?? {}),
  });
}

/** Shift summary counts for one change; false = prior state uncached, refetch. */
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

/** Patch an item across cached pages — state flips now, position corrects on refetch. */
function patchPageCaches(
  queryClient: QueryClient,
  id: number,
  patch: ItemPatch,
) {
  for (const prefix of [itemsKey.tasksAll, itemsKey.history]) {
    queryClient.setQueriesData<InfiniteData<ItemsPageVM>>(
      { queryKey: prefix },
      (data) => (data ? patchPages(data, id, patch) : data),
    );
  }
}

/** PATCH one item — optimistic on Review, detail, and pages; exits remove rows in place. */
export function usePatchItem() {
  const queryClient = useQueryClient();
  return useMutation({
    // Same-scope mutations serialize, so a slow old response can't overwrite a newer one.
    scope: { id: "item-patch" },
    mutationFn: ({ id, patch }: { id: number; patch: ItemPatch }) =>
      patchItem(id, patch),
    onMutate: async ({ id, patch }) => {
      const before = findCachedItem(queryClient, id)?.item;
      const snapshot = await optimistically(queryClient, (items) =>
        applyPatch(items, id, patch),
      );
      // Send-back and Done exit every tasks walk — rows leave here, not via refetch.
      if (patch.saved === false || patch.status === "Done") {
        queryClient.setQueriesData<InfiniteData<ItemsPageVM>>(
          { queryKey: itemsKey.tasksAll },
          (data) => (data ? removeFromPages(data, id) : data),
        );
        snapshot.tasksAdjusted = true;
      }
      // Send-back only: the patched copy joins Review at its id-order slot.
      if (patch.saved === false && before && snapshot.previous) {
        const patched = applyPatch([before], id, patch)[0];
        queryClient.setQueryData<ActionItem[]>(itemsKey.review, (items) =>
          items ? insertByIdOrder(items, patched) : items,
        );
        snapshot.reviewAdjusted = true;
      }
      queryClient.setQueryData<ActionItem>(itemsKey.detail(id), (item) =>
        item ? applyPatch([item], id, patch)[0] : item,
      );
      patchPageCaches(queryClient, id, patch);
      // Reopen: the row exits History here; removal keeps pages ordered, cursors valid.
      if (
        before?.status === "Done" &&
        patch.status !== undefined &&
        patch.status !== "Done"
      ) {
        queryClient.setQueryData<InfiniteData<ItemsPageVM>>(
          itemsKey.history,
          (data) => (data ? removeFromPages(data, id) : data),
        );
        snapshot.historyAdjusted = true;
      }
      snapshot.summaryAdjusted = adjustSummary(
        queryClient,
        before,
        (b) => applyPatch([b], id, patch)[0],
      );
      snapshot.beforeStatus = before?.status;
      snapshot.beforeSaved = before?.saved;
      return snapshot;
    },
    onSuccess: (serverItem) => {
      // The server's copy is the truth (it stamps `completed`).
      queryClient.setQueryData(itemsKey.detail(serverItem.id), serverItem);
      // Its Review row gets the same truth; an undefined updater result is a no-op.
      queryClient.setQueryData<ActionItem[]>(itemsKey.review, (items) =>
        items?.map((item) => (item.id === serverItem.id ? serverItem : item)),
      );
    },
    onError: (_error, _vars, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't save the change — reverted."),
    // On success, keep whatever the optimistic writes already made true; errors refetch all.
    onSettled: (_data, error, { id, patch }, snapshot) => {
      const knownNotDone =
        snapshot?.beforeStatus !== undefined &&
        snapshot.beforeStatus !== "Done";
      const statusOnly =
        Object.keys(patch).length === 1 &&
        patch.status !== undefined &&
        patch.status !== "Done" &&
        knownNotDone;
      // Review keeps when the insert already moved it, or the patch can't change membership.
      const review =
        snapshot?.reviewAdjusted === true ||
        (!("saved" in patch) &&
          (snapshot?.beforeSaved === true ||
            (patch.status !== "Done" && knownNotDone)));
      settleItems(
        queryClient,
        error
          ? undefined
          : {
              detailId: id,
              summary: snapshot?.summaryAdjusted,
              statusOnly,
              review,
              history: snapshot?.historyAdjusted,
              tasks: snapshot?.tasksAdjusted,
            },
      );
      void queryClient.invalidateQueries({ queryKey: meetingsKey.detailAll });
    },
  });
}

/** Delete one item — optimistic on Review; meetings refetch too (itemCounts changed). */
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
      snapshot.meetingId = before?.meetingId;
      return snapshot;
    },
    onError: (_error, _id, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't delete the item — restored."),
    // Only the deleted item's meeting detail is dirty; unknown meeting = refetch all.
    onSettled: (_data, error, id, snapshot) => {
      if (error === null) {
        // Drop the detail entry rather than mark it stale — a refetch would just 404.
        queryClient.removeQueries({ queryKey: itemsKey.detail(id) });
      }
      // Review keeps: the optimistic removal IS the membership change (204 confirmed).
      settleItems(
        queryClient,
        error
          ? undefined
          : { summary: snapshot?.summaryAdjusted, review: true },
      );
      const meetingId = snapshot?.meetingId;
      void queryClient.invalidateQueries({
        queryKey: meetingsKey.all,
        predicate: (query) =>
          error !== null ||
          meetingId === undefined ||
          query.queryKey[1] !== "detail" ||
          query.queryKey[2] === meetingId,
      });
    },
  });
}

/** "Save N to Tasks": Review empties optimistically; settle pulls rows into Tasks. */
export function useSaveToTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAllToTasks,
    onMutate: async () => {
      const snapshot = await optimistically(queryClient, clearPending);
      // The batch rule needs no per-item lookup: Review always empties.
      queryClient.setQueryData<ItemSummary>(itemsKey.summary, (summary) =>
        summary ? summaryAfterSaveAll(summary) : summary,
      );
      snapshot.summaryAdjusted = true;
      return snapshot;
    },
    onError: (_error, _vars, snapshot) =>
      rollback(queryClient, snapshot, "Couldn't save to Tasks — reverted."),
    // Review keeps: the clear IS the exit; Tasks refetch the entry, meetings refresh.
    onSettled: (_data, error, _vars, snapshot) => {
      settleItems(
        queryClient,
        error
          ? undefined
          : { summary: snapshot?.summaryAdjusted, review: true },
      );
      void queryClient.invalidateQueries({ queryKey: meetingsKey.detailAll });
    },
  });
}
