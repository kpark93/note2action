// Outermost wrapper every view's JSX starts with, so entrance animation and
// column-fill layout aren't repeated per screen.
// Path: views/*/*.view.tsx → [this file] (leaf — no further calls).
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Outer wrapper for a routed view: entrance animation + fills the layout
 * column. Callers pass extra classes for scroll/width (tailwind-merge).
 */
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
