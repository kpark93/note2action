// Reusable "nothing here" placeholder used by every view with a list
// (Review, Tasks, History, Meetings) when that list is empty or loading.
// Path: views/*/*.view.tsx → [this file] (leaf — renders only markup).
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Bold first line; omit for a single-line muted message. */
  title?: string;
  /** Muted description under the title (or the whole message when no title). */
  children: ReactNode;
}

/** Dashed placeholder card shown when a list has nothing to display. */
export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="rounded-[20px] border border-dashed border-border bg-card px-6 py-[52px] text-center">
      {title ? (
        <>
          <div className="text-[15px] font-semibold">{title}</div>
          <p className="mt-2 text-[13px] text-muted-foreground">{children}</p>
        </>
      ) : (
        <p className="text-[13.5px] text-muted-foreground">{children}</p>
      )}
    </div>
  );
}
