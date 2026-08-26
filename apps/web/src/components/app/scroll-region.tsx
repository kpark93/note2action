/** Generic scroll container used by every view's list/grid area, so the scroll
 * mechanics live in one place. Leaf — no further calls. */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Scrollable fill area with the scrollbar inset off the content edge — layout
 * classes come from the caller. */
export function ScrollRegion({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-x-hidden overflow-y-auto -mr-1 pr-1",
        className,
      )}
    >
      {children}
    </div>
  );
}
