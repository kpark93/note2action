// Step 3 of the flow: saved tasks grouped by status, with filters and a
// status dropdown per row. Status changes are optimistic (§2) via
// usePatchItem — handleStatus below adds a "Done" completion animation.
// Path §1 [hop 2/15]: [this file] → items.queries (request-paths.md §2).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useItemsQuery, usePatchItem } from "@/domain/items/items.queries";
import { useTasksStore } from "./tasks.store";
import { OWNERS, PRIORITIES, STATUSES } from "@/domain/items/items.constants";
import { savedTasks } from "@/domain/items/items.utils";
import { taskRows } from "./tasks.utils";
import { TaskRow } from "./components/task-row";
import { playPop } from "@/lib/sound";
import type { Status } from "@/domain/items/items.types";
import { Button } from "@/components/ui/button";
import { StepLabel } from "@/components/app/step-label";
import { ViewHeader } from "@/components/app/view-header";
import { SectionHeading } from "@/components/app/section-heading";
import { ViewShell } from "@/components/app/view-shell";
import { ScrollRegion } from "@/components/app/scroll-region";
import { Toolbar } from "@/components/app/toolbar";
import { FilterSelect } from "@/components/app/filter-select";

const OPEN_STATUSES = STATUSES.slice(0, 3);
// Tasks are grouped into these sections, most-active first.
const STATUS_SECTIONS: Status[] = ["In progress", "Blocked", "Not started"];

export function TasksView() {
  const items = useItemsQuery().data ?? [];
  const filterOwner = useTasksStore((s) => s.filterOwner);
  const filterStatus = useTasksStore((s) => s.filterStatus);
  const filterPriority = useTasksStore((s) => s.filterPriority);
  const setFilterOwner = useTasksStore((s) => s.setFilterOwner);
  const setFilterStatus = useTasksStore((s) => s.setFilterStatus);
  const setFilterPriority = useTasksStore((s) => s.setFilterPriority);
  const clearFilters = useTasksStore((s) => s.clearFilters);
  const patchItem = usePatchItem();
  const navigate = useNavigate();

  // Track the row being completed so it stays mounted long enough to play the
  // pop animation before it leaves the list for History.
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Wired to TaskRow's onStatusChange: non-"Done" patches immediately
  // (optimistic); "Done" starts the pop animation and defers to handleCompleted.
  const handleStatus = (id: number, value: Status) => {
    if (value === "Done") {
      playPop();
      setCompletingId(id);
    } else {
      patchItem.mutate({ id, patch: { status: value } });
    }
  };

  // Fired by TaskRow when its taskComplete animation ends — the patch waits
  // for the animation itself, not a timer, so CSS owns the duration.
  const handleCompleted = (id: number) => {
    patchItem.mutate({ id, patch: { status: "Done" } });
    setCompletingId((cur) => (cur === id ? null : cur));
  };

  const rows = taskRows(items, filterOwner, filterStatus, filterPriority);
  const savedCount = savedTasks(items).length;

  return (
    <ViewShell>
      <ViewHeader
        eyebrow={<StepLabel step={3} label="Tasks" />}
        title="Tasks"
        description={
          <>
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
          </>
        }
        actions={
          <Button
            variant="cta"
            onClick={() => navigate("/capture")}
            className="flex-none"
          >
            New capture
          </Button>
        }
      />

      <Toolbar className="gap-[9px]">
        <FilterSelect
          value={filterOwner}
          onValueChange={setFilterOwner}
          allLabel="All owners"
          options={OWNERS}
        />
        <FilterSelect
          value={filterStatus}
          onValueChange={setFilterStatus}
          allLabel="All statuses"
          options={OPEN_STATUSES}
        />
        <FilterSelect
          value={filterPriority}
          onValueChange={setFilterPriority}
          allLabel="All priorities"
          options={PRIORITIES}
        />
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="h-[38px] rounded-[12px] px-[13px] text-[13px] font-medium text-muted-foreground"
        >
          Clear
        </Button>
      </Toolbar>

      <ScrollRegion className="flex flex-col gap-4">
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
                <SectionHeading label={status} count={sectionRows.length} />
                <div className="flex flex-col gap-[7px]">
                  {sectionRows.map((row) => (
                    <TaskRow
                      key={row.id}
                      row={row}
                      isCompleting={completingId === row.id}
                      onStatusChange={handleStatus}
                      onCompleted={handleCompleted}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </ScrollRegion>
    </ViewShell>
  );
}
