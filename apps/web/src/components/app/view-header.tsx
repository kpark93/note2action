// Standard page-title block used at the top of every view.
// Path: views/*/*.view.tsx → [this file] (leaf — no further calls).
import type { ReactNode } from "react";

interface ViewHeaderProps {
  /** Small slot above the title, e.g. <StepLabel />. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Muted paragraph under the title. */
  description?: ReactNode;
  /** Right-aligned header actions (buttons, filters). */
  actions?: ReactNode;
}

/** Standard page header: eyebrow + 25px title + muted description left, actions right. */
export function ViewHeader({
  eyebrow,
  title,
  description,
  actions,
}: ViewHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-10">
      <div>
        {eyebrow}
        <h1
          className={`text-[25px] font-bold leading-[1.12] tracking-[-0.03em]${eyebrow ? " mt-[7px]" : ""}`}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-[7px] max-w-[70ch] text-[13px] leading-[1.5] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-none items-center gap-[10px]">{actions}</div>
      )}
    </div>
  );
}
