import { z } from "zod";

// Zod schema (runtime validator) + derived TS type for the health check.
// Parsed by apps/web (health.queries.ts, drives the sidebar status dot);
// mirrored by hand in the API's app/schemas/health.py.
// Path: GET /api/health (FastAPI) → [this file] → web's request() parses it.

/** Shape of the API's health-check response. */
export const HealthResponse = z.object({
  status: z.string(),
  service: z.string(),
  /** ISO-8601 timestamp. */
  time: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
