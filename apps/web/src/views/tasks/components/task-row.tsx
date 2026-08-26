/** One task row: owner, title, due, priority, status dropdown, send-back icon.
 * Next hop: usePatchItem for send-back; status changes call onStatusChange. */
import { usePatchItem } from "@/domain/items/items.queries";
import { STATUSES } from "@/domain/items/items.constants";
import { STATUS_STYLE } from "@/views/tasks/tasks.utils";
import type { TaskRowVM } from "@/views/tasks/tasks.utils";
import type { Status } from "@/domain/items/items.types";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./priority-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Shared grid template so every row's columns line up without a header row. */
export const COLS = "grid-cols-[minmax(0,1fr)_96px_88px_132px_34px]";

interface TaskRowProps {
  row: TaskRowVM;
  /** True while this row plays its completion animation before leaving for History. */
  isCompleting: boolean;
  /** Called from the status Select; tasks.view.tsx owns the actual PATCH. */
  onStatusChange: (id: number, value: Status) => void;
  /** Fires when the taskComplete animation ends; tasks.view.tsx then patches "Done". */
  onCompleted: (id: number) => void;
}

/** Owner initials, title, due, priority pill, status select, send-back. */
export function TaskRow({
  row,
  isCompleting,
  onStatusChange,
  onCompleted,
}: TaskRowProps) {
  const patchItem = usePatchItem();
  const sc = STATUS_STYLE[row.status];

  return (
    <div
      className={`task-row grid ${COLS} items-center gap-[14px] rounded-[14px] bg-card px-4 py-[10px] ${
        isCompleting ? "task-complete" : "n2a-row"
      }`}
      style={isCompleting ? undefined : { animationDelay: row.delay }}
      // animationend bubbles (the task-burst child fires one too) — the name
      // guard makes sure only the row's own animation triggers the patch.
      onAnimationEnd={(e) => {
        if (isCompleting && e.animationName === "taskComplete")
          onCompleted(row.id);
      }}
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
      <PriorityBadge priority={row.priority} className="justify-self-start" />
      <Select
        value={row.status}
        onValueChange={(v) => onStatusChange(row.id, v as Status)}
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
        onClick={() =>
          patchItem.mutate({ id: row.id, patch: { saved: false } })
        }
        title="Send back to Review"
        aria-label="Send back to Review"
        className="h-7 w-7 justify-self-center rounded-[9px] border-border bg-transparent text-muted-foreground shadow-none dark:border-border dark:bg-transparent"
      >
        <Undo2 className="size-[13px]" />
      </Button>
    </div>
  );
}
