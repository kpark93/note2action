import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActionItems } from "@/store/actionItems.store";
import { useTasksStore } from "./tasks.store";
import { OWNERS, STATUSES } from "@/store/actionItems.constants";
import { savedTasks } from "@/lib/items";
import { taskRows } from "./tasks.utils";
import { TaskRow } from "@/components/app/task-row";
import { playPop } from "@/lib/sound";
import type { Status } from "@/store/actionItems.types";
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
  const items = useActionItems((s) => s.items);
  const filterOwner = useTasksStore((s) => s.filterOwner);
  const filterStatus = useTasksStore((s) => s.filterStatus);
  const setFilterOwner = useTasksStore((s) => s.setFilterOwner);
  const setFilterStatus = useTasksStore((s) => s.setFilterStatus);
  const clearFilters = useTasksStore((s) => s.clearFilters);
  const update = useActionItems((s) => s.update);
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

  const rows = taskRows(items, filterOwner, filterStatus);
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
