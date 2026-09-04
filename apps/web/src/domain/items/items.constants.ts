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

/** Colors for each status pill, shared by Tasks' Select and RecentModal. */
export const STATUS_STYLE: Record<
  Status,
  { bg: string; fg: string; border: string }
> = {
  "Not started": {
    bg: "hsl(var(--foreground) / 0.06)",
    fg: "hsl(var(--muted-foreground))",
    border: "hsl(var(--foreground) / 0.14)",
  },
  "In progress": {
    bg: "hsl(var(--primary) / 0.24)",
    fg: "hsl(var(--pill-blue))",
    border: "hsl(var(--primary) / 0.45)",
  },
  Blocked: {
    bg: "hsl(var(--magenta) / 0.16)",
    fg: "hsl(var(--pill-magenta))",
    border: "hsl(var(--magenta) / 0.4)",
  },
  Done: {
    bg: "hsl(var(--foreground) / 0.1)",
    fg: "hsl(var(--foreground))",
    border: "hsl(var(--foreground) / 0.2)",
  },
};
