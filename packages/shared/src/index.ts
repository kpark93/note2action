// Shared contract between the frontend(s) and the API.
//
// Each shape is a Zod *schema* (a runtime value that can validate data) paired
// with a TypeScript *type* derived from it via `z.infer`. They intentionally
// share a name: `HealthResponse` is the schema in value-space and the type in
// type-space — TS keeps those separate, so `HealthResponse.parse(x)` (value)
// and `const h: HealthResponse` (type) both work from the one declaration.
//
// Define the shape once → get runtime validation AND the static type for free.

import { z } from "zod";

/** App display name, shared so both apps stay in sync. */
export const APP_NAME = "note2action";

/** GET /api/health */
export const HealthResponse = z.object({
  status: z.string(),
  service: z.string(),
  /** ISO-8601 timestamp. */
  time: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;

/** Task priority, shared by the extractor and the web UI. */
export const Priority = z.enum(["High", "Medium", "Low"]);
export type Priority = z.infer<typeof Priority>;

/** Task status, shared by the extractor and the web UI. */
export const Status = z.enum(["Not started", "In progress", "Blocked", "Done"]);
export type Status = z.infer<typeof Status>;

/** One persisted action item — mirrors the action_items table. */
export const ActionItem = z.object({
  id: z.number(),
  meetingId: z.number(),
  /** Title of the meeting the item came from — joined in by the API for display. */
  meeting: z.string(),
  title: z.string(),
  owner: z.string(),
  due: z.string().nullable(),
  priority: Priority,
  confidence: z.number(),
  saved: z.boolean(),
  note: z.string().nullable(),
  status: Status,
  completed: z.string().nullable(),
});
export type ActionItem = z.infer<typeof ActionItem>;

/** GET /api/items */
export const ItemsResponse = z.object({
  items: z.array(ActionItem),
});
export type ItemsResponse = z.infer<typeof ItemsResponse>;

/**
 * PATCH /api/items/{id} body — only the fields being changed. `completed` is
 * deliberately absent: the server stamps it from `status` (Done ⟺ set).
 */
export const ActionItemPatch = z.object({
  title: z.string().optional(),
  owner: z.string().optional(),
  due: z.string().nullable().optional(),
  priority: Priority.optional(),
  confidence: z.number().optional(),
  status: Status.optional(),
  saved: z.boolean().optional(),
  note: z.string().nullable().optional(),
});
export type ActionItemPatch = z.infer<typeof ActionItemPatch>;

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

/**
 * One action item extracted from raw notes by the AI. The `.describe()` calls
 * are sent to the model (via the AI SDK) to steer the extraction — keep them
 * accurate.
 */
export const ExtractedItem = z.object({
  title: z
    .string()
    .describe("Concise, imperative action, e.g. 'Ship pricing page copy'."),
  owner: z
    .string()
    .describe(
      "Person responsible — one of the provided owners, or 'Unassigned' if unclear.",
    ),
  priority: Priority.describe(
    "High, Medium, or Low, based on urgency and importance.",
  ),
  due: z
    .string()
    .describe(
      "Due date as YYYY-MM-DD, inferred relative to today; '' if none was implied.",
    ),
  confidence: z
    .number()
    .describe(
      "0-100: confidence in this extraction (owner, date, and intent).",
    ),
  note: z
    .string()
    .describe("Short rationale or a supporting quote from the notes."),
});
export type ExtractedItem = z.infer<typeof ExtractedItem>;

/** POST /api/extract (AI app) request body. */
export const ExtractRequest = z.object({
  notes: z.string(),
  meetingTitle: z.string(),
  /** Caller's current date (YYYY-MM-DD) so relative dates resolve correctly. */
  today: z.string(),
  owners: z.array(z.string()),
});
export type ExtractRequest = z.infer<typeof ExtractRequest>;

/** POST /api/extract (AI app) response body. */
export const ExtractResponse = z.object({
  items: z.array(ExtractedItem),
});
export type ExtractResponse = z.infer<typeof ExtractResponse>;

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

/** POST /api/items/save-to-tasks — batch-save every pending Review item. */
export const SaveToTasksResponse = z.object({
  updated: z.number(),
});
export type SaveToTasksResponse = z.infer<typeof SaveToTasksResponse>;
