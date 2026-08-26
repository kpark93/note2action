// Colored priority pill, shared by TaskRow (Tasks) — small enough it has no
// further calls of its own.
// Path: task-row.tsx → [this file] (leaf).
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Priority } from "@/domain/items/items.types";

// Theme-aware pill colors (see --pill-* / --magenta in global.css):
// dark & saturated on light backgrounds, pastel on dark ones.
const PRIORITY_CLASSES: Record<Priority, string> = {
  High: "bg-[hsl(var(--magenta)/0.16)] text-[hsl(var(--pill-magenta))]",
  Medium: "bg-[hsl(var(--primary)/0.22)] text-[hsl(var(--pill-blue))]",
  Low: "bg-[hsl(var(--foreground)/0.07)] text-[hsl(var(--muted-foreground))]",
};

/** Colored pill naming an item's priority. */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <Badge
      variant="ghost"
      className={cn(
        "border-0 rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold",
        PRIORITY_CLASSES[priority],
        className,
      )}
    >
      {priority}
    </Badge>
  );
}
