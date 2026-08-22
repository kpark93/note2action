import { z } from "zod";

// Zod schema + type for the health check. Parsed by apps/web
// (health.queries.ts). Path: GET /api/health → [this file] → request().

/** Shape of the API's health-check response. */
export const HealthResponse = z.object({
  status: z.string(),
  service: z.string(),
  /** ISO-8601 timestamp. */
  time: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
