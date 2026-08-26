// Full list of saved captures (Capture screen's RECENT strip caps at 3;
// this has no limit). No view-local store — no filters/toggles needed.
// Path: [this file] → meetings.queries (read) + extraction.store's
// openRecent() (opens RecentModal).
import { useMeetingsQuery } from "@/domain/meetings/meetings.queries";
import { useActionItems } from "@/domain/extraction/extraction.store";
import { formatDate, timeAgo } from "@/lib/dates";
import { ViewShell } from "@/components/app/view-shell";
import { ViewHeader } from "@/components/app/view-header";
import { ScrollRegion } from "@/components/app/scroll-region";
import { EmptyState } from "@/components/app/empty-state";

/**
 * All saved captures, newest first, as full-width cards. Clicking one
 * opens the shared RecentModal via the same store action RECENT uses.
 */
export function MeetingsView() {
  // All meetings, not the RECENT strip's three (limit=1000 stands in for
  // "no limit" until the API needs real paging).
  const { data, isPending } = useMeetingsQuery(1000);
  const meetings = data ?? [];
  const openRecent = useActionItems((s) => s.openRecent);

  return (
    <ViewShell>
      <ViewHeader
        title="Meetings"
        description="Every capture you've saved, newest first. Click one to read the transcript or load it back into Capture."
      />

      {isPending ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState title="Loading…">Fetching your meetings.</EmptyState>
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState title="No meetings yet">
            Extract action items from your notes and the capture lands here.
          </EmptyState>
        </div>
      ) : (
        <ScrollRegion className="mt-4 flex flex-col gap-[7px]">
          {meetings.map((meeting, idx) => (
            <button
              key={meeting.id}
              onClick={() => openRecent(meeting.id)}
              className="n2a-row recent-btn flex w-full cursor-pointer items-center gap-4 rounded-[14px] border border-border bg-card px-4 py-[13px] text-left text-foreground"
              style={{ animationDelay: idx * 35 + "ms" }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="overflow-hidden text-[14.5px] font-semibold tracking-[-0.015em] text-ellipsis whitespace-nowrap">
                  {meeting.title}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {meeting.itemCount}{" "}
                  {meeting.itemCount === 1 ? "item" : "items"} extracted
                </span>
              </span>
              {/* Hover swaps "1d ago" for the date; both labels share one
                  grid cell so the hover target never moves (no flicker). */}
              <span className="group/when grid flex-none text-right text-[12px] tabular-nums text-muted-foreground">
                <span className="col-start-1 row-start-1 transition-opacity duration-150 group-hover/when:opacity-0">
                  {timeAgo(meeting.capturedAt)}
                </span>
                <span
                  className="col-start-1 row-start-1 opacity-0 transition-opacity duration-150 group-hover/when:opacity-100"
                  aria-hidden="true"
                >
                  {formatDate(meeting.capturedAt.slice(0, 10))}
                </span>
              </span>
            </button>
          ))}
        </ScrollRegion>
      )}
    </ViewShell>
  );
}
