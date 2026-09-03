/** Sidebar widget showing completion progress — reads useItemsQuery itself so
 * it shares every other screen's cache, no props needed. */
import { useSummaryQuery } from "@/domain/items/items.queries";

/** "Completion this month" widget: percent, progress bar, closed/open counts. */
export function CompletionCard() {
  const s = useSummaryQuery().data;
  const doneCount = s?.done ?? 0;
  const openCount = s?.open ?? 0;
  const pct = s && s.total ? Math.round((s.done / s.total) * 100) : 0;

  return (
    <div className="rounded-[16px] bg-secondary p-[14px]">
      <div className="text-[11.5px] text-muted-foreground">
        Completion this month
      </div>
      <div className="mt-[7px] text-[24px] font-bold tracking-[-0.03em] tabular-nums">
        {/* key remounts the span when the value changes, replaying the fade. */}
        <span key={pct} className="n2a-pct">
          {pct}%
        </span>
      </div>
      <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-muted">
        <div
          className="n2a-bar h-full rounded-full bg-primary"
          style={{ width: pct + "%" }}
        />
      </div>
      <div className="mt-[11px] text-[11.5px] text-muted-foreground">
        {doneCount} closed · {openCount} open
      </div>
    </div>
  );
}
