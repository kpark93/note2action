// TanStack Query hooks for meetings (captures) — server state, cached.
import { useQuery } from "@tanstack/react-query";
import { fetchMeeting, fetchMeetings } from "@/domain/meetings/meetings.api";

export const meetingsKey = ["meetings"] as const;

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
