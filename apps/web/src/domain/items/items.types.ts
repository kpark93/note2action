// View-model types for the action-items feature.
//
// The wire contract (shared ActionItem) uses `null` for "none"; the UI's
// inputs (`<input type="date">`) can only hold strings, so the view-model
// uses "" instead. lib/items.api.ts is the border where the two translate.
// Path: [this file] (types) — imported by items.api.ts, items.queries.ts,
// items.cache.ts, items.utils.ts, and every view's *.utils.ts.
import type { ActionItem as WireActionItem } from "@note2action/shared";

export type { Priority, Status } from "@note2action/shared";

export interface ActionItem extends Omit<WireActionItem, "due" | "note"> {
  /** ISO date `YYYY-MM-DD`, or "" when no date was inferred. */
  due: string;
  /** Supporting quote / rationale from the transcript; may be absent. */
  note?: string;
}
