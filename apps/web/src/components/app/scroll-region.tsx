/** Generic scroll container for every view's list area — one home for the mechanics. */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Scrollable fill area, scrollbar inset; layout classes come from the caller. */
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
