import { useActionItems } from "@/store/actionItems.store";
import { useHistoryStore } from "./history.store";
import { OWNERS } from "@/store/actionItems.constants";
import { historyGroups, historyStats } from "./history.utils";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROW_COLS = "grid-cols-[minmax(0,2fr)_minmax(0,1fr)_88px_88px]";

export function HistoryView() {
  const items = useActionItems((s) => s.items);
  const historyOwner = useHistoryStore((s) => s.historyOwner);
  const setHistoryOwner = useHistoryStore((s) => s.setHistoryOwner);
  const update = useActionItems((s) => s.update);

  const groups = historyGroups(items, historyOwner);
  const stats = historyStats(items);

  return (
    <div className="n2a-view flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-10">
        <div>
          <h1 className="text-[25px] font-bold leading-[1.12] tracking-[-0.03em]">
            History
          </h1>
          <p className="mt-[7px] max-w-[64ch] text-[13px] text-muted-foreground">
            Completed action items, newest first. Nothing is deleted — reopen
            anything that comes back.
          </p>
        </div>
        <Select value={historyOwner} onValueChange={setHistoryOwner}>
          <SelectTrigger className="min-w-[164px] flex-none rounded-[12px] border-border bg-card px-[13px] text-[13px] text-foreground data-[size=default]:h-[38px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All owners</SelectItem>
            {OWNERS.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="my-4 grid flex-none grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[16px] bg-card px-4 py-[13px]">
            <div className="text-[12.5px] text-muted-foreground">{s.label}</div>
            <div className="mt-[6px] text-[23px] font-bold tracking-[-0.035em] tabular-nums">
              {s.value}
            </div>
            <div className="mt-[9px] h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="n2a-bar h-full rounded-full"
                style={{ width: s.bar, background: s.barColor }}
              />
            </div>
            <div className="mt-[7px] text-[11px] text-muted-foreground">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-x-hidden overflow-y-auto -mr-1 pr-1">
        {groups.map((g) => (
          <section key={g.key}>
            <SectionHeading label={g.label} count={g.count} />
            <div className="flex flex-col gap-[6px]">
              {g.items.map((h) => (
                <div
                  key={h.id}
                  className={`history-row grid ${ROW_COLS} items-center gap-3 rounded-[13px] bg-card px-4 py-[9px]`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      ✓
                    </span>
                    <span className="overflow-hidden text-[14.5px] font-medium text-ellipsis whitespace-nowrap text-muted-foreground line-through decoration-muted-foreground/50">
                      {h.title}
                    </span>
                  </span>
                  <span className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-foreground">
                    {h.owner}
                  </span>
                  <span className="text-[12.5px] tabular-nums text-muted-foreground">
                    {h.completedLabel}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => update(h.id, "status", "In progress")}
                    className="h-[31px] justify-self-end rounded-[10px] border-border bg-transparent px-[13px] text-[12.5px] font-medium text-muted-foreground shadow-none dark:border-border dark:bg-transparent"
                  >
                    Reopen
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <EmptyState title="Nothing completed yet">
            Mark a task Done and it lands here with the date it was closed.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
