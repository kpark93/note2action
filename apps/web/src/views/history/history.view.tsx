// History screen: completed items grouped by week, plus summary stats.
// Read-only — items/meetings come from the TanStack Query cache (§1 read
// path); the owner filter is view-local state (history.store.ts).
// Path: [this file] → items.queries / meetings.queries → history.utils.
import { useMeetingsQuery } from "@/domain/meetings/meetings.queries";
import { useItemsQuery } from "@/domain/items/items.queries";
import { useHistoryStore } from "./history.store";
import { OWNERS } from "@/domain/items/items.constants";
import { historyGroups, historyStats } from "./history.utils";
import { HistoryRow } from "./components/history-row";
import { ViewHeader } from "@/components/app/view-header";
import { ViewShell } from "@/components/app/view-shell";
import { ScrollRegion } from "@/components/app/scroll-region";
import { SectionHeading } from "@/components/app/section-heading";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "./components/stat-card";
import { FilterSelect } from "@/components/app/filter-select";

export function HistoryView() {
  const items = useItemsQuery().data ?? [];
  // All meetings, not the RECENT strip's three — the stat counts the lot.
  // (limit=1000 stands in for "no limit" until the API needs real paging.)
  const meetings = useMeetingsQuery(1000).data ?? [];
  const historyOwner = useHistoryStore((s) => s.historyOwner);
  const setHistoryOwner = useHistoryStore((s) => s.setHistoryOwner);

  const groups = historyGroups(items, historyOwner);
  const stats = historyStats(items, meetings.length);

  return (
    <ViewShell>
      <ViewHeader
        title="History"
        description="Completed action items, newest first. Nothing is deleted — reopen anything that comes back."
        actions={
          <FilterSelect
            value={historyOwner}
            onValueChange={setHistoryOwner}
            allLabel="All owners"
            options={OWNERS}
            className="flex-none"
          />
        }
      />

      <div className="my-4 grid flex-none grid-cols-3 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <ScrollRegion className="flex flex-col gap-[14px]">
        {groups.map((g) => (
          <section key={g.key}>
            <SectionHeading label={g.label} count={g.count} />
            <div className="flex flex-col gap-[6px]">
              {g.items.map((h) => (
                <HistoryRow key={h.id} item={h} />
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <EmptyState title="Nothing completed yet">
            Mark a task Done and it lands here with the date it was closed.
          </EmptyState>
        )}
      </ScrollRegion>
    </ViewShell>
  );
}
