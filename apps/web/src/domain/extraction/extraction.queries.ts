/** Capture mutation — extract via the AI app, persist as a meeting; drafts in store. */
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
import type { ItemSummary } from "@note2action/shared";

/** Notes in, items persisted as a meeting; hook-level onSuccess survives unmounts. */
export function useExtractCapture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: extractKey,
    mutationFn: async (
      payload: ExtractRequest,
    ): Promise<CreateMeetingResponse> => {
      const items = await extractActionItems(payload);
      // Persist at extraction: database rows NOW, so Review survives refresh.
      return createMeeting({
        title: payload.meetingTitle,
        rawNotes: payload.notes,
        items,
      });
    },
    onSuccess: (data) => {
      useActionItems.getState().clearDraft();
      // Seed from the response — the server just said everything a capture changes.
      queryClient.setQueryData<ItemSummary>(itemsKey.summary, (summary) =>
        summary ? summaryAfterCapture(summary, data.items.length) : summary,
      );
      // The new items join Review (id-ordered; newest ids, so append).
      queryClient.setQueryData<ActionItem[]>(itemsKey.review, (items) =>
        items ? [...items, ...data.items.map(fromWire)] : items,
      );
      // What's left: the paginated walks — page boundaries are the server's call.
      void queryClient.invalidateQueries({
        queryKey: itemsKey.all,
        predicate: (query) =>
          query.queryKey[1] !== "detail" &&
          query.queryKey[1] !== "summary" &&
          query.queryKey[1] !== "review",
      });
      void queryClient.invalidateQueries({
        queryKey: meetingsKey.all,
        predicate: (query) => query.queryKey[1] !== "detail",
      });
    },
  });
}

/** Capture status from the shared mutation cache — survives unmount and remount. */
export function useExtractionStatus() {
  const states = useMutationState({
    filters: { mutationKey: extractKey },
    select: (m) => ({ status: m.state.status, error: m.state.error }),
  });
  return latestExtractionStatus(states);
}
