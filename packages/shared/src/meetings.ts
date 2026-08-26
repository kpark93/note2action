// Contract for the API's /api/meetings endpoints — a "capture" is a saved
// meeting (raw notes + AI-extracted items, persisted together). Used by
// apps/web (meetings.api.ts); mirrored by hand in app/schemas/meetings.py.
// Path: web capture flow → POST /api/meetings → [this file] → web UI.

import { z } from "zod";

import { ActionItem } from "./items";
import { ExtractedItem } from "./extraction";

/** One captured meeting, as listed on Capture's RECENT strip. */
export const Meeting = z.object({
  id: z.number(),
  title: z.string(),
  /** ISO-8601 timestamp, stamped by the server at capture time. */
  capturedAt: z.string(),
  /** Derived (COUNT of the meeting's items) — never stored. */
  itemCount: z.number(),
});
export type Meeting = z.infer<typeof Meeting>;

/** POST /api/meetings request body — persist a capture and its extracted items. */
export const CreateMeetingRequest = z.object({
  title: z.string(),
  rawNotes: z.string(),
  items: z.array(ExtractedItem),
});
export type CreateMeetingRequest = z.infer<typeof CreateMeetingRequest>;

/** POST /api/meetings response body: the created meeting and its persisted items. */
export const CreateMeetingResponse = z.object({
  meeting: Meeting,
  items: z.array(ActionItem),
});
export type CreateMeetingResponse = z.infer<typeof CreateMeetingResponse>;

/** GET /api/meetings — recent captures, newest first. */
export const MeetingsResponse = z.object({
  meetings: z.array(Meeting),
});
export type MeetingsResponse = z.infer<typeof MeetingsResponse>;

/** GET /api/meetings/{id} — a Meeting plus its transcript, said as the
 * relationship (extend), not a restated shape. */
export const MeetingDetail = Meeting.extend({
  rawNotes: z.string(),
});
export type MeetingDetail = z.infer<typeof MeetingDetail>;
