/** Contract for /api/meetings — a "capture" is a saved meeting (raw notes +
 * extracted items). Mirrored by hand in app/schemas/meetings.py. */

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

/** GET /api/meetings with `cursor` — one keyset page, newest first. */
export const MeetingsPage = z.object({
  meetings: z.array(Meeting),
  nextCursor: z.string().nullable(),
});
export type MeetingsPage = z.infer<typeof MeetingsPage>;

/** GET /api/meetings/{id} — a Meeting plus its transcript and the items
 * extracted from it, said as the relationship (extend), not a restated shape. */
export const MeetingDetail = Meeting.extend({
  rawNotes: z.string(),
  items: z.array(ActionItem),
});
export type MeetingDetail = z.infer<typeof MeetingDetail>;
