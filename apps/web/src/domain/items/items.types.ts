// View-model types for the action-items feature. The wire contract
// (shared ActionItem) uses `null` for "none"; the UI's date input can only
// hold strings, so the view-model uses "" instead — items.api.ts is the
// border where the two translate. Path: [this file] → items.api.ts, etc.
import type { ActionItem as WireActionItem } from "@note2action/shared";

export type { Priority, Status } from "@note2action/shared";

export interface ActionItem extends Omit<WireActionItem, "due" | "note"> {
  /** ISO date `YYYY-MM-DD`, or "" when no date was inferred. */
  due: string;
  /** Supporting quote / rationale from the transcript; may be absent. */
  note?: string;
}
