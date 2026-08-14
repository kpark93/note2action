import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scrollable fill area with the scrollbar inset off the content edge
 * (-mr-1/pr-1). Owns only the scroll mechanics — display/layout classes
 * (flex column, card grid, gaps) come from the caller.
 */
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
