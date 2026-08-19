// TanStack Query hooks — the app's window onto server state.
//
// Queries read and cache; mutations change data and then *invalidate* the
// cache, so every view refetches fresh truth instead of trusting a local copy.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteItem,
  fetchItems,
  patchItem,
  saveAllToTasks,
  type ItemPatch,
} from "@/lib/items.api";
import { fetchMeeting, fetchMeetings } from "@/lib/meetings.api";

export const itemsKey = ["items"] as const;
export const meetingsKey = ["meetings"] as const;

export function useItemsQuery() {
  return useQuery({ queryKey: itemsKey, queryFn: fetchItems });
}

export function usePatchItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: ItemPatch }) =>
      patchItem(id, patch),
    onSettled: () => queryClient.invalidateQueries({ queryKey: itemsKey }),
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: itemsKey });
      // A delete changes the meetings' itemCounts too.
      void queryClient.invalidateQueries({ queryKey: meetingsKey });
    },
  });
}

export function useSaveToTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAllToTasks,
    onSettled: () => queryClient.invalidateQueries({ queryKey: itemsKey }),
  });
}

export function useMeetingsQuery(limit = 3) {
  return useQuery({
    queryKey: [...meetingsKey, limit],
    queryFn: () => fetchMeetings(limit),
  });
}

/** One meeting's detail; only fires while a meeting is actually open. */
export function useMeetingQuery(id: number | null) {
  return useQuery({
    queryKey: [...meetingsKey, id],
    queryFn: () => fetchMeeting(id as number),
    enabled: id !== null,
  });
}
