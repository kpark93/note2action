/** TanStack mutation for the capture flow — extract via the AI app, persist
 * as a meeting; drafts stay in extraction.store.ts. Next hop: extraction.api
 * → meetings.api. */
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreateMeetingResponse,
  ExtractRequest,
} from "@note2action/shared";
import { extractActionItems } from "./extraction.api";
import { latestExtractionStatus } from "./extraction.utils";
import { useActionItems } from "./extraction.store";
import { createMeeting } from "@/domain/meetings/meetings.api";
import { summaryAfterCapture } from "@/domain/items/items.cache";
import { fromWire } from "@/domain/items/items.api";
import type { ActionItem } from "@/domain/items/items.types";
import { extractKey, itemsKey, meetingsKey } from "@/lib/query-keys";
import type { ItemSummary, Meeting } from "@note2action/shared";

/**
 * The capture mutation: notes in, extracted items persisted as a meeting.
 * Hook-level onSuccess (invalidate + clear draft) runs even if Capture
 * unmounted mid-flight; navigation belongs in the caller's mutate() callback,
 * which correctly skips when the user has already left.
 */
export function useExtractCapture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: extractKey,
    mutationFn: async (
      payload: ExtractRequest,
    ): Promise<CreateMeetingResponse> => {
      const items = await extractActionItems(payload);
      // Persist at extraction: the capture becomes database rows NOW, so
      // the Review queue survives refresh.
      return createMeeting({
        title: payload.meetingTitle,
        rawNotes: payload.notes,
        items,
      });
    },
    onSuccess: (data) => {
      useActionItems.getState().clearDraft();
      // Seed from the response — the server just told us everything a
      // capture changes, so nothing here needs a refetch:
      // counters move by delta…
      queryClient.setQueryData<ItemSummary>(itemsKey.summary, (summary) =>
        summary ? summaryAfterCapture(summary, data.items.length) : summary,
      );
      // …the new items join the Review queue (id-ordered; these are the
      // newest ids, so append)…
      queryClient.setQueryData<ActionItem[]>(itemsKey.review, (items) =>
        items ? [...items, ...data.items.map(fromWire)] : items,
      );
      // …and the new meeting tops the RECENT strip (newest-first, cap 3).
      queryClient.setQueryData<Meeting[]>(meetingsKey.list(3), (meetings) =>
        meetings ? [data.meeting, ...meetings].slice(0, 3) : meetings,
      );
      // What's left: the paginated walks (items pages, meetings infinite) —
      // their page boundaries are the server's call — all lazily marked;
      // details unchanged by an ADD, review/summary/strip seeded above.
      void queryClient.invalidateQueries({
        queryKey: itemsKey.all,
        predicate: (query) =>
          query.queryKey[1] !== "detail" &&
          query.queryKey[1] !== "summary" &&
          query.queryKey[1] !== "review",
      });
      void queryClient.invalidateQueries({
        queryKey: meetingsKey.all,
        predicate: (query) =>
          query.queryKey[1] !== "detail" && query.queryKey[1] !== "list",
      });
    },
  });
}

/** Live capture-flow status from the shared mutation cache — unlike a hook
 * instance's isPending, this survives Capture unmounting and remounting. */
export function useExtractionStatus() {
  const states = useMutationState({
    filters: { mutationKey: extractKey },
    select: (m) => ({ status: m.state.status, error: m.state.error }),
  });
  return latestExtractionStatus(states);
}
