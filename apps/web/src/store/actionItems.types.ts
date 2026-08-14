// Domain types for the action-items feature.
//
// Ported from the v2 design mock. Richer than the shared `Item` contract
// (which the API currently speaks) — kept local until the backend grows to
// match. See constants.ts for the seed data and store.ts for the state.

export type Screen = "home" | "capture" | "review" | "tasks" | "history";

export type Priority = "High" | "Medium" | "Low";

export type Status = "Not started" | "In progress" | "Blocked" | "Done";

export interface ActionItem {
  id: number;
  title: string;
  owner: string;
  /** ISO date `YYYY-MM-DD`, or "" when no date was inferred. */
  due: string;
  priority: Priority;
  /** Extraction confidence, 0–100. Below the threshold → "needs review". */
  confidence: number;
  status: Status;
  /** True once saved from Review into the Tasks list (accumulates there). */
  saved: boolean;
  /** Supporting quote / rationale from the transcript. */
  note?: string;
  /** Meeting the item was extracted from. */
  meeting: string;
  /** ISO date the item was closed, set when status becomes "Done". */
  completed?: string | null;
}
