import { useItemsQuery } from "@/lib/items.queries";
import { summary } from "@/lib/items";
import { SlotNumber } from "./slot-number";

/** "Completion this month" widget: animated percent, progress bar, closed/open counts. */
export function CompletionCard() {
  const items = useItemsQuery().data ?? [];
  const { donePct, doneCount, openCount } = summary(items);
  const pct = parseInt(donePct, 10) || 0;

  return (
    <div className="rounded-[16px] bg-secondary p-[14px]">
      <div className="text-[11.5px] text-muted-foreground">
        Completion this month
      </div>
      <div className="mt-[7px] text-[24px] font-bold tracking-[-0.03em] tabular-nums">
        <SlotNumber value={pct} />
      </div>
      <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-muted">
        <div
          className="n2a-bar h-full rounded-full bg-primary"
          style={{ width: donePct }}
        />
      </div>
      <div className="mt-[11px] text-[11.5px] text-muted-foreground">
        {doneCount} closed · {openCount} open
      </div>
    </div>
  );
}
