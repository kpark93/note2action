/** One of the three metric tiles atop History — pure presentation; all numbers
 * come pre-computed from historyStats(). */
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatCardProps {
  label: string;
  /** Headline figure, e.g. 12 or "86%". */
  value: string | number;
  /** 0-100 share drawn by the bar. */
  percent: number;
  /** CSS color for the bar, e.g. "hsl(var(--primary))". */
  barColor: string;
  /** Footnote under the bar, e.g. "across 4 meetings". */
  delta: string;
}

/** Compact metric tile: label, big number, thin progress bar, footnote. */
export function StatCard({
  label,
  value,
  percent,
  barColor,
  delta,
}: StatCardProps) {
  return (
    <Card className="gap-0 rounded-[16px] border-0 px-4 py-[13px] shadow-none">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className="mt-[6px] text-[23px] font-bold tracking-[-0.035em] tabular-nums">
        {value}
      </div>
      <Progress
        value={percent}
        className="mt-[9px] h-1 bg-muted"
        indicatorClassName="n2a-bar"
        indicatorStyle={{ background: barColor }}
      />
      <div className="mt-[7px] text-[11px] text-muted-foreground">{delta}</div>
    </Card>
  );
}
