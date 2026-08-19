import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Outer wrapper for a routed view: entrance animation (.n2a-view) + fills the
 * layout column. Views that scroll themselves or cap their width pass the
 * extra classes (tailwind-merge resolves overflow conflicts).
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
