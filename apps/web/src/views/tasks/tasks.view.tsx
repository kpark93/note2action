import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActionItems } from "@/store/actionItems.store";
import { useTasksStore } from "./tasks.store";
import { OWNERS, STATUSES } from "@/store/actionItems.constants";
import { savedTasks } from "@/lib/items";
import { PRIORITY_STYLE, STATUS_STYLE, taskRows } from "./tasks.utils";
import type { TaskRowVM } from "./tasks.utils";
import { playPop } from "@/lib/sound";
import type { Status } from "@/store/actionItems.types";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepLabel } from "@/components/StepLabel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLS = "grid-cols-[minmax(0,1fr)_96px_88px_132px_34px]";
const OPEN_STATUSES = STATUSES.slice(0, 3);
// Tasks are grouped into these sections, most-active first.
const STATUS_SECTIONS: Status[] = ["In progress", "Blocked", "Not started"];

export function TasksView() {
  const items = useActionItems((s) => s.items);
  const filterOwner = useTasksStore((s) => s.filterOwner);
  const filterStatus = useTasksStore((s) => s.filterStatus);
  const setFilterOwner = useTasksStore((s) => s.setFilterOwner);
  const setFilterStatus = useTasksStore((s) => s.setFilterStatus);
  const clearFilters = useTasksStore((s) => s.clearFilters);
  const update = useActionItems((s) => s.update);
  const sendToReview = useActionItems((s) => s.sendToReview);
  const navigate = useNavigate();

  // Track the row being completed so it stays mounted long enough to play the
  // pop animation before it leaves the list for History.
  const [completingId, setCompletingId] = useState<number | null>(null);

  const handleStatus = (id: number, value: Status) => {
    if (value === "Done") {
      playPop();
      setCompletingId(id);
      window.setTimeout(() => {
        update(id, "status", "Done");
        setCompletingId((cur) => (cur === id ? null : cur));
      }, 500);
    } else {
      update(id, "status", value);
    }
  };

  const renderRow = (row: TaskRowVM) => {
    const pr = PRIORITY_STYLE[row.priority];
    const sc = STATUS_STYLE[row.status];
    const isCompleting = completingId === row.id;
    return (
      <div
        key={row.id}
        className={`task-row grid ${COLS} items-center gap-[14px] rounded-[14px] bg-card px-4 py-[10px] ${
          isCompleting ? "task-complete" : "n2a-row"
        }`}
        style={isCompleting ? undefined : { animationDelay: row.delay }}
      >
        {isCompleting && (
          <span className="task-burst" aria-hidden="true">
            ✓
          </span>
        )}
        <span className="flex min-w-0 items-center gap-[11px]">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] bg-secondary text-[10.5px] font-semibold text-muted-foreground">
            {row.initials}
          </span>
          <span className="flex min-w-0 flex-col gap-[3px]">
            <span className="overflow-hidden text-[14.5px] font-semibold tracking-[-0.015em] text-ellipsis whitespace-nowrap">
              {row.title}
            </span>
            <span className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap text-muted-foreground">
              {row.owner}
            </span>
          </span>
        </span>
        <span className="text-[12px] tabular-nums whitespace-nowrap text-muted-foreground">
          {row.dueLabel}
        </span>
        <span
          className="inline-flex justify-self-start rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold"
          style={{ background: pr.bg, color: pr.fg }}
        >
          {row.priority}
        </span>
        <Select
          value={row.status}
          onValueChange={(v) => handleStatus(row.id, v as Status)}
        >
          <SelectTrigger
            className="w-full rounded-[11px] px-[11px] text-[12.5px] font-semibold shadow-none data-[size=default]:h-[34px] [&_svg]:!text-current"
            style={{ background: sc.bg, color: sc.fg, borderColor: sc.border }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => sendToReview(row.id)}
          title="Send back to Review"
          aria-label="Send back to Review"
          className="h-7 w-7 justify-self-center rounded-[9px] border-border bg-transparent text-muted-foreground shadow-none dark:border-border dark:bg-transparent"
        >
          <Undo2 className="size-[13px]" />
        </Button>
      </div>
    );
  };

  const rows = taskRows(items, filterOwner, filterStatus);
  const savedCount = savedTasks(items).length;

  return (
    <div className="n2a-view flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-10">
        <div>
          <StepLabel step={3} label="Tasks" />
          <h1 className="mt-[7px] text-[25px] font-bold leading-[1.12] tracking-[-0.03em]">
            Tasks
          </h1>
          <p className="mt-[7px] text-[13px] text-muted-foreground">
            {rows.length} of {savedCount} open items · completed work moves to{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/history");
              }}
            >
              History
            </a>
          </p>
        </div>
        <Button
          onClick={() => navigate("/capture")}
          className="h-10 flex-none rounded-[13px] px-[18px] text-[13.5px] font-semibold"
          style={{ boxShadow: "0 8px 22px hsl(var(--primary) / 0.3)" }}
        >
          New capture
        </Button>
      </div>

      <div className="my-3 flex items-center gap-[9px]">
        <Select value={filterOwner} onValueChange={setFilterOwner}>
          <SelectTrigger className="min-w-[164px] rounded-[12px] border-border bg-card px-[13px] text-[13px] text-foreground data-[size=default]:h-[38px]">
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="min-w-[164px] rounded-[12px] border-border bg-card px-[13px] text-[13px] text-foreground data-[size=default]:h-[38px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {OPEN_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="h-[38px] rounded-[12px] px-[13px] text-[13px] font-medium text-muted-foreground"
        >
          Clear
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto -mr-1 pr-1">
        {rows.length === 0 ? (
          <div className="rounded-[16px] bg-card px-5 py-[52px] text-center text-[13.5px] text-muted-foreground">
            {savedCount === 0
              ? "No tasks yet — save items from the Review tab."
              : "No open items match these filters."}
          </div>
        ) : (
          STATUS_SECTIONS.map((status) => {
            const sectionRows = rows.filter((r) => r.status === status);
            if (sectionRows.length === 0) return null;
            return (
              <section key={status}>
                <div className="mb-[7px] flex items-center gap-3">
                  <h2 className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    {status}
                  </h2>
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[12px] text-muted-foreground">
                    {sectionRows.length}
                  </span>
                </div>
                <div className="flex flex-col gap-[7px]">
                  {sectionRows.map(renderRow)}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
