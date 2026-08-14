interface SectionHeadingProps {
  label: string;
  /** Row count shown at the hairline's right end — a bare number (Tasks) or preformatted text like "3 items" (History). */
  count: string | number;
}

/** "LABEL ───── count" heading above a group of rows (Tasks status sections, History weeks). */
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
