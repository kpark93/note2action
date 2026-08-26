/** Item option lists shared across features; STATUSES/PRIORITIES derive from
 * the zod contract — one source of truth, no drift. */
import { Priority, Status } from "@note2action/shared";

export const OWNERS = [
  "Rachel Ng",
  "Kyle Park",
  "Marcus Hale",
  "Priya Shah",
  "Unassigned",
] as const;
export type Owner = (typeof OWNERS)[number];

export const STATUSES: Status[] = [...Status.options];
export const PRIORITIES: Priority[] = [...Priority.options];

/** Confidence below this is flagged as "needs review". */
export const LOW_CONFIDENCE_THRESHOLD = 80;
