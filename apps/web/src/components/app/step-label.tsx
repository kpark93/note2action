/** "STEP N OF 3" marker for the three-step flow: Capture, Review, Tasks. */

/** Eyebrow label above a view heading, e.g. "STEP 1 OF 3 — CAPTURE". */
export function StepLabel({
  step,
  total = 3,
  label,
}: {
  step: number;
  total?: number;
  label: string;
}) {
  return (
    <div className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground">
      STEP {step} OF {total} — {label.toUpperCase()}
    </div>
  );
}
