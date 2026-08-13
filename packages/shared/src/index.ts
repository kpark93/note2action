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

/** A single note-to-action item. */
export const Item = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
});
export type Item = z.infer<typeof Item>;

/** GET /api/items */
export const ItemsResponse = z.object({
  items: z.array(Item),
});
export type ItemsResponse = z.infer<typeof ItemsResponse>;

/** Task priority, shared by the extractor and the web UI. */
export const Priority = z.enum(["High", "Medium", "Low"]);
export type Priority = z.infer<typeof Priority>;

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
    .describe("0-100: confidence in this extraction (owner, date, and intent)."),
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
