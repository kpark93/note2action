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
