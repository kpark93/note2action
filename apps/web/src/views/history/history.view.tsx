/** History screen: completed items grouped by week, plus summary stats. Read
 * only — data from the TanStack cache; the owner filter is view-local state. */
import { useState } from "react";
import {
  useHistoryInfinite,
  useSummaryQuery,
} from "@/domain/items/items.queries";
import { ItemModal } from "@/components/app/item-modal";
import { LoadMoreSentinel } from "@/components/app/load-more-sentinel";
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
  const historyOwner = useHistoryStore((s) => s.historyOwner);
  const setHistoryOwner = useHistoryStore((s) => s.setHistoryOwner);

  /** Item shown in the detail modal, or null when closed. */
  const [openItemId, setOpenItemId] = useState<number | null>(null);

  // Owner filter rides in the query key — a change starts a fresh walk.
  const historyQuery = useHistoryInfinite(historyOwner);
  const groups = historyGroups(
    historyQuery.data?.pages.flatMap((page) => page.items) ?? [],
  );
  // Stat tiles come from the summary counts — loaded pages grow as the user
  // scrolls, so they can never be the denominator.
  const summary = useSummaryQuery().data;
  const stats = summary ? historyStats(summary) : [];

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
                <HistoryRow key={h.id} item={h} onOpen={setOpenItemId} />
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && !historyQuery.isPending && (
          <EmptyState title="Nothing completed yet">
            Mark a task Done and it lands here with the date it was closed.
          </EmptyState>
        )}
        <LoadMoreSentinel
          disabled={!historyQuery.hasNextPage}
          loading={historyQuery.isFetchingNextPage}
          onVisible={() => {
            if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) {
              void historyQuery.fetchNextPage();
            }
          }}
        />
      </ScrollRegion>

      <ItemModal itemId={openItemId} onClose={() => setOpenItemId(null)} />
    </ViewShell>
  );
}
