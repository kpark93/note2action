/** Zod schema + type for the health check, parsed by apps/web's health.queries.ts. */
import { z } from "zod";

/** Shape of the API's health-check response. */
export const HealthResponse = z.object({
  status: z.string(),
  service: z.string(),
  /** ISO-8601 timestamp. */
  time: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
