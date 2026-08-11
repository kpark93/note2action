// Shared TypeScript types and constants used by both apps/web and apps/ai.
// These describe the contract between the frontend(s) and the API.

/** App display name, shared so both apps stay in sync. */
export const APP_NAME = "note2action";

/** Response shape for GET /api/health. */
export interface HealthResponse {
  status: string;
  service: string;
  /** ISO-8601 timestamp. */
  time: string;
}

/** A single note-to-action item. */
export interface Item {
  id: string;
  title: string;
  done: boolean;
}

/** Response shape for GET /api/items. */
export interface ItemsResponse {
  items: Item[];
}
