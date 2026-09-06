/** Colored priority pill used by TaskRow. Leaf — no further calls. */
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRIORITY_STYLE } from "@/domain/items/items.constants";
import type { Priority } from "@/domain/items/items.types";

/** Colored pill naming an item's priority. */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const pc = PRIORITY_STYLE[priority];
  return (
    <Badge
      variant="ghost"
      className={cn(
        "border-0 rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold",
        className,
      )}
      style={{ background: pc.bg, color: pc.fg }}
    >
      {priority}
    </Badge>
  );
}
