/** Typed API calls for meetings (captures), used by meetings.queries.ts and
 * extraction.store.ts. Next hop: lib/http.ts → API. */
import {
  CreateMeetingResponse,
  MeetingDetail,
  MeetingsPage,
  type CreateMeetingRequest,
  type Meeting,
} from "@note2action/shared";
import { request } from "@/lib/http";

/** Persist a capture — the meeting and its extracted items, in one call. */
export async function createMeeting(
  payload: CreateMeetingRequest,
): Promise<CreateMeetingResponse> {
  return request("/api/meetings", {
    body: payload,
    schema: CreateMeetingResponse,
  });
}

/** Recent captures, newest first — the RECENT strip. Same paged endpoint as
 * the infinite walk; the strip just never asks for page two. */
export async function fetchMeetings(limit = 3): Promise<Meeting[]> {
  const { meetings } = await request(`/api/meetings?limit=${limit}`, {
    schema: MeetingsPage,
  });
  return meetings;
}

/** One keyset page of captures for the Meetings screen's infinite walk. */
export async function fetchMeetingsPage(
  cursor: string | null,
): Promise<MeetingsPage> {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);
  return request(`/api/meetings?${params}`, { schema: MeetingsPage });
}

/** One full capture, transcript included — the modal. */
export async function fetchMeeting(id: number): Promise<MeetingDetail> {
  return request(`/api/meetings/${id}`, { schema: MeetingDetail });
}
