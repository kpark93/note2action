// Shared Zod contract: each export is a schema + same-named type via
// z.infer (`ActionItem.parse(x)` is the value, `ActionItem` the type).
// Mirrored by hand in the API's schemas.
// Path: action_items table → api/routes/items.py → [this file] → web UI.

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

/** POST /api/items/save-to-tasks — batch-save every pending Review item. */
export const SaveToTasksResponse = z.object({
  updated: z.number(),
});
export type SaveToTasksResponse = z.infer<typeof SaveToTasksResponse>;
