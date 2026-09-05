/** Shared Zod contract: each export is a schema + same-named type via z.infer.
 * Mirrored by hand in the API's schemas (app/schemas/items.py). */

import { z } from "zod";

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
  /** Meeting title, joined in by the API for display. */
  meeting: z.string(),
  title: z.string(),
  owner: z.string(),
  due: z.string().nullable(),
  priority: Priority,
  saved: z.boolean(),
  note: z.string().nullable(),
  status: Status,
  completed: z.string().nullable(),
});
export type ActionItem = z.infer<typeof ActionItem>;

/** GET /api/items?view=tasks|history|review — one keyset page. nextCursor is
 * opaque (base64 of the last row's sort key + id); null = no more pages. */
export const ItemsPage = z.object({
  items: z.array(ActionItem),
  nextCursor: z.string().nullable(),
});
export type ItemsPage = z.infer<typeof ItemsPage>;

/** GET /api/items/summary — the counts the sidebar and History stats need,
 * computed in SQL so no view ever fetches all rows just to count them. */
export const ItemSummary = z.object({
  done: z.number().int(),
  open: z.number().int(),
  review: z.number().int(),
  total: z.number().int(),
  /** Done items closed on/before their due date (undated counts as on time). */
  onTime: z.number().int(),
  meetings: z.number().int(),
});
export type ItemSummary = z.infer<typeof ItemSummary>;

/** PATCH /api/items/{id} body — ActionItem's editable fields, all optional.
 * `completed` is deliberately absent: the server stamps it from `status`. */
export const ActionItemPatch = ActionItem.pick({
  title: true,
  owner: true,
  due: true,
  priority: true,
  status: true,
  saved: true,
  note: true,
}).partial();
export type ActionItemPatch = z.infer<typeof ActionItemPatch>;

/** POST /api/items/save-to-tasks — batch-save every pending Review item. */
export const SaveToTasksResponse = z.object({
  updated: z.number(),
});
export type SaveToTasksResponse = z.infer<typeof SaveToTasksResponse>;
