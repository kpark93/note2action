/** View-model item types: wire null becomes "" here — items.api.ts translates. */
import type { ActionItem as WireActionItem } from "@note2action/shared";

export type { Priority, Status } from "@note2action/shared";

export interface ActionItem extends Omit<WireActionItem, "due" | "note"> {
  /** ISO date `YYYY-MM-DD`, or "" when no date was inferred. */
  due: string;
  /** Supporting quote / rationale from the transcript; may be absent. */
  note?: string;
}
