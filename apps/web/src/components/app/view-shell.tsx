/** Outermost wrapper for every view: shared entrance animation + column fill. */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Entrance animation + column fill; callers pass extra classes (tailwind-merge). */
export function ViewShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "n2a-view flex min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
