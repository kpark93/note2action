// Typed API calls for meetings (captures), through the `/api` dev proxy.
// Called by meetings.queries.ts (reads) and extraction.store.ts
// (createMeeting, right after an AI extraction).
// Path: [this file] → lib/http.ts → API (request-paths.md §3).
import {
  CreateMeetingResponse,
  MeetingDetail,
  MeetingsResponse,
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

/** Recent captures, newest first — the RECENT strip. */
export async function fetchMeetings(limit = 3): Promise<Meeting[]> {
  const { meetings } = await request(`/api/meetings?limit=${limit}`, {
    schema: MeetingsResponse,
  });
  return meetings;
}

/** One full capture, transcript included — the modal. */
export async function fetchMeeting(id: number): Promise<MeetingDetail> {
  return request(`/api/meetings/${id}`, { schema: MeetingDetail });
}
