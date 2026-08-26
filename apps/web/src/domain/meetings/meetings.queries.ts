/** TanStack Query hooks for meetings (captures) — cached server state.
 * Next hop: meetings.api.ts → lib/http.ts. */
import { useQuery } from "@tanstack/react-query";
import { fetchMeeting, fetchMeetings } from "@/domain/meetings/meetings.api";
import { meetingsKey } from "@/lib/query-keys";

/** Recent captures, newest first (capped at `limit`) — GET /api/meetings. */
export function useMeetingsQuery(limit = 3) {
  return useQuery({
    queryKey: meetingsKey.list(limit),
    queryFn: () => fetchMeetings(limit),
  });
}

/** One meeting's detail; only fires while a meeting is actually open. */
export function useMeetingQuery(id: number | null) {
  return useQuery({
    queryKey: meetingsKey.detail(id ?? -1),
    queryFn: () => fetchMeeting(id as number),
    enabled: id !== null,
  });
}
