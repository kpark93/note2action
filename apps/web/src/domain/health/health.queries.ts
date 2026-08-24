// TanStack Query wrapper for the API health check.
// Path: sidebar.tsx (status dot) → [this file] → lib/http.ts →
// API /api/health.
import { useQuery } from "@tanstack/react-query";
import { HealthResponse } from "@note2action/shared";
import { request } from "@/lib/http";
import { healthKey } from "@/lib/query-keys";

/** GET /api/health, validated against the shared contract. */
export function getHealth() {
  return request("/api/health", { schema: HealthResponse });
}

/** TanStack Query hook for the API health check (drives the sidebar status dot). */
export function useHealth() {
  return useQuery({ queryKey: healthKey, queryFn: getHealth });
}
