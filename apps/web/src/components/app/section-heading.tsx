/** Small labeled divider above grouped rows — Tasks status sections and History
 * week groups. */
interface SectionHeadingProps {
  label: string;
  /** Count at the hairline's right end — a bare number or text like "3 items". */
  count: string | number;
}

/** "LABEL ───── count" heading above a group of rows. */
export function SectionHeading({ label, count }: SectionHeadingProps) {
  return (
    <div className="mb-[7px] flex items-center gap-3">
      <h2 className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </h2>
      <span className="h-px flex-1 bg-border" />
      <span className="text-[12px] text-muted-foreground">{count}</span>
    </div>
  );
}
