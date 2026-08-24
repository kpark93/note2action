// Request/response contract for the ai app's POST /api/extract, plus the
// ExtractedItem shape (later wrapped into an ActionItem once persisted).
// Used by apps/ai (extraction.ts) and apps/web (extraction.api/.store.ts).
// Path: capture → POST /ai-api/extract → [this file] → generateObject.

import { z } from "zod";

import { Priority } from "./items";

/**
 * One extracted action item. `.describe()` calls below are sent to the
 * model as instructions — keep them accurate.
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
  // int(1-100) rides into the model's JSON-schema constraints, so fractional
  // output (0.9) is rejected at generation time — no client normalization.
  confidence: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe(
      "Whole number from 1 to 100 (never a 0-1 fraction): confidence in " +
        "this extraction (owner, date, and intent).",
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
