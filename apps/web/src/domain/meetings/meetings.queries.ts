/** TanStack Query hooks for meetings (captures) — cached server state.
 * Next hop: meetings.api.ts → lib/http.ts. */
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Meeting, MeetingDetail, MeetingsPage } from "@note2action/shared";
import {
  fetchMeeting,
  fetchMeetingsPage,
} from "@/domain/meetings/meetings.api";
import { meetingsKey } from "@/lib/query-keys";

/** The Meetings screen's keyset walk — newest first, page by page. */
export function useMeetingsInfinite() {
  return useInfiniteQuery({
    queryKey: meetingsKey.infinite,
    queryFn: ({ pageParam }) => fetchMeetingsPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** The infinite walk's summary of one meeting, if any page has it. */
function findCachedMeeting(
  queryClient: QueryClient,
  id: number,
): Meeting | undefined {
  const pages = queryClient.getQueryData<InfiniteData<MeetingsPage>>(
    meetingsKey.infinite,
  );
  for (const page of pages?.pages ?? []) {
    const hit = page.meetings.find((m) => m.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/** One meeting's detail; only mounted while a modal is open, so the id is
 * always real. The clicked row's cached summary becomes placeholderData
 * (docs: placeholder query data) — header renders instantly, transcript +
 * items fill in when the fetch lands; never written to the cache. */
export function useMeetingQuery(id: number) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: meetingsKey.detail(id),
    queryFn: () => fetchMeeting(id),
    placeholderData: (): MeetingDetail | undefined => {
      const summary = findCachedMeeting(queryClient, id);
      return summary ? { ...summary, rawNotes: "", items: [] } : undefined;
    },
  });
}
