/** One of the two clickable tiles on Home ("N to review", "N open tasks").
 * Leaf — no further calls. */
interface RecapCardProps {
  value: number;
  label: string;
  cta: string;
  /** Navigates to the relevant screen (Review or Tasks); set by the caller. */
  onClick: () => void;
}

/** Clickable summary tile: big count, label, and a "Go to …" call to action. */
export function RecapCard({ value, label, cta, onClick }: RecapCardProps) {
  return (
    <button
      onClick={onClick}
      className="recent-btn flex flex-col items-start gap-1 rounded-[16px] border border-border bg-card px-5 py-[18px] text-left"
    >
      <span className="text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums">
        {value}
      </span>
      <span className="mt-1 text-[13.5px] text-muted-foreground">{label}</span>
      <span className="mt-2 text-[12.5px] font-medium text-primary">
        {cta} →
      </span>
    </button>
  );
}
