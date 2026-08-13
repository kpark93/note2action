import { HealthResponse } from "@note2action/shared";

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // `.parse` validates the payload at runtime and returns it typed as
  // HealthResponse. If the API drifts from the contract, this throws.
  return HealthResponse.parse(await res.json());
}
