// Contract for the API's /api/meetings endpoints — a "capture" is a saved
// meeting (raw notes + the AI's extracted items, persisted together).
// Used by apps/web (meetings.api.ts) to call the API and type the RECENT
// strip / capture detail view; mirrored by hand in app/schemas/meetings.py.
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

/** GET /api/meetings/{id} — one full capture, transcript included. */
export const MeetingDetail = z.object({
  id: z.number(),
  title: z.string(),
  rawNotes: z.string(),
  capturedAt: z.string(),
  itemCount: z.number(),
});
export type MeetingDetail = z.infer<typeof MeetingDetail>;
