import { HealthResponse } from "@note2action/shared";
import { request } from "@/lib/http";

/** GET /api/health, validated against the shared contract. */
export function getHealth() {
  return request("/api/health", { schema: HealthResponse });
}
