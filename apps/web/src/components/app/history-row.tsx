import { useActionItems } from "@/store/actionItems.store";
import type { ActionItem } from "@/store/actionItems.types";
import { Button } from "@/components/ui/button";

/** Shared grid template so every row's columns line up without a header row. */
const ROW_COLS = "grid-cols-[minmax(0,2fr)_minmax(0,1fr)_88px_88px]";

interface HistoryRowProps {
  item: ActionItem & { completedLabel: string };
}

/** One completed item: check mark, struck-through title, owner, completion date, Reopen. */
export function HistoryRow({ item }: HistoryRowProps) {
  const update = useActionItems((s) => s.update);

  return (
    <div
      className={`history-row grid ${ROW_COLS} items-center gap-3 rounded-[13px] bg-card px-4 py-[9px]`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          ✓
        </span>
        <span className="overflow-hidden text-[14.5px] font-medium text-ellipsis whitespace-nowrap text-muted-foreground line-through decoration-muted-foreground/50">
          {item.title}
        </span>
      </span>
      <span className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-foreground">
        {item.owner}
      </span>
      <span className="text-[12.5px] tabular-nums text-muted-foreground">
        {item.completedLabel}
      </span>
      <Button
        variant="outline"
        onClick={() => update(item.id, "status", "In progress")}
        className="h-[31px] justify-self-end rounded-[10px] border-border bg-transparent px-[13px] text-[12.5px] font-medium text-muted-foreground shadow-none dark:border-border dark:bg-transparent"
      >
        Reopen
      </Button>
    </div>
  );
}
