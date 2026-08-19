import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Filter/actions row between the view header and the content area. */
export function Toolbar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("my-3 flex items-center", className)}>{children}</div>
  );
}
