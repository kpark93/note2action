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
import { extractKey, itemsKey, meetingsKey } from "@/lib/query-keys";
import type { ItemSummary } from "@note2action/shared";

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
    onSuccess: async (data) => {
      useActionItems.getState().clearDraft();
      // The response tells us the summary delta exactly — no refetch needed.
      queryClient.setQueryData<ItemSummary>(itemsKey.summary, (summary) =>
        summary ? summaryAfterCapture(summary, data.items.length) : summary,
      );
      // A capture only ADDS rows: lists and pages must refetch, but no
      // existing detail changed and the summary was just delta'd — exclude
      // both. Awaited: mutate()-level onSuccess (navigation) fires only
      // after Review's data is refetched; meetings refresh lazily.
      await queryClient.invalidateQueries({
        queryKey: itemsKey.all,
        predicate: (query) =>
          query.queryKey[1] !== "detail" && query.queryKey[1] !== "summary",
      });
      void queryClient.invalidateQueries({
        queryKey: meetingsKey.all,
        predicate: (query) => query.queryKey[1] !== "detail",
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
