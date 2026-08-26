/** Small badge on each ReviewCard showing the AI's extraction confidence.
 * Leaf — no further calls. */
import { Badge } from "@/components/ui/badge";

interface ConfidencePillProps {
  /** Confidence as display text, e.g. "86%". */
  pct: string;
  /** Low-confidence items get the blue "needs review" treatment. */
  low: boolean;
}

/** Dot + percentage + verdict pill shown on Review cards. */
export function ConfidencePill({ pct, low }: ConfidencePillProps) {
  const fg = low ? "text-[hsl(var(--pill-blue))]" : "text-muted-foreground";
  return (
    <Badge
      variant="ghost"
      className={`flex-none gap-[7px] rounded-full px-[10px] py-1 ${
        low
          ? "border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.14)]"
          : "border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--foreground)/0.06)]"
      }`}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-primary" />
      <span className={`text-[11.5px] font-semibold tabular-nums ${fg}`}>
        {pct}
      </span>
      <span className={`text-[11.5px] font-medium ${fg}`}>
        {low ? "needs review" : "confident"}
      </span>
    </Badge>
  );
}
