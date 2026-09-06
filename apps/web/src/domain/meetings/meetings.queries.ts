/** TanStack Query hooks for meetings (captures) — cached server state.
 * Next hop: meetings.api.ts → lib/http.ts. */
import {
  skipToken,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Meeting, MeetingDetail, MeetingsPage } from "@note2action/shared";
import {
  fetchMeeting,
  fetchMeetings,
  fetchMeetingsPage,
} from "@/domain/meetings/meetings.api";
import { meetingsKey } from "@/lib/query-keys";

/** Recent captures, newest first (capped at `limit`) — GET /api/meetings. */
export function useMeetingsQuery(limit = 3) {
  return useQuery({
    queryKey: meetingsKey.list(limit),
    queryFn: () => fetchMeetings(limit),
  });
}

/** The Meetings screen's keyset walk — newest first, page by page. */
export function useMeetingsInfinite() {
  return useInfiniteQuery({
    queryKey: meetingsKey.infinite,
    queryFn: ({ pageParam }) => fetchMeetingsPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** The list caches' summary of one meeting, if any page has it. */
function findCachedMeeting(
  queryClient: QueryClient,
  id: number,
): Meeting | undefined {
  const strip = queryClient
    .getQueryData<Meeting[]>(meetingsKey.list(3))
    ?.find((m) => m.id === id);
  if (strip) return strip;
  const pages = queryClient.getQueryData<InfiniteData<MeetingsPage>>(
    meetingsKey.infinite,
  );
  for (const page of pages?.pages ?? []) {
    const hit = page.meetings.find((m) => m.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/** One meeting's detail; skipToken parks it while no meeting is open. The
 * clicked row's cached summary becomes placeholderData (docs: placeholder
 * query data) — header renders instantly, transcript + items fill in when
 * the fetch lands; the placeholder is never written to the cache. */
export function useMeetingQuery(id: number | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: meetingsKey.detail(id),
    queryFn: id === null ? skipToken : () => fetchMeeting(id),
    placeholderData: (): MeetingDetail | undefined => {
      if (id === null) return undefined;
      const summary = findCachedMeeting(queryClient, id);
      return summary ? { ...summary, rawNotes: "", items: [] } : undefined;
    },
  });
}
