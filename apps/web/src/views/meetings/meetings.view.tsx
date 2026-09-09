/** Full list of saved captures (the Capture screen's RECENT strip caps at 3;
 * this has no limit). Next hop: meetings.queries + its own RecentModal. */
import { useState } from "react";
import { useMeetingsInfinite } from "@/domain/meetings/meetings.queries";
import { RecentModal } from "@/components/app/recent-modal";
import { LoadMoreSentinel } from "@/components/app/load-more-sentinel";
import { formatInstantDate, timeAgo } from "@/lib/dates";
import { ViewShell } from "@/components/app/view-shell";
import { ViewHeader } from "@/components/app/view-header";
import { ScrollRegion } from "@/components/app/scroll-region";
import { EmptyState } from "@/components/app/empty-state";

/** All saved captures, newest first, as full-width cards — clicking one opens
 * this view's RecentModal. */
export function MeetingsView() {
  // Real paging now: pages of 20, newest first, loaded as the user scrolls.
  const meetingsQuery = useMeetingsInfinite();
  const { isPending } = meetingsQuery;
  const meetings =
    meetingsQuery.data?.pages.flatMap((page) => page.meetings) ?? [];
  /** Meeting shown in the transcript modal, or null when closed. */
  const [openMeetingId, setOpenMeetingId] = useState<number | null>(null);

  return (
    <ViewShell>
      <ViewHeader
        title="Meetings"
        description="Every capture you've saved, newest first. Click one to read the transcript and its items."
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
              onClick={() => setOpenMeetingId(meeting.id)}
              className="n2a-row recent-btn flex w-full cursor-pointer items-center gap-4 rounded-[14px] border border-border bg-card px-4 py-[13px] text-left text-foreground"
              // Capped: idx spans every loaded page — uncapped, deep rows
              // of the infinite walk would wait seconds to appear.
              style={{ animationDelay: Math.min(idx, 8) * 30 + "ms" }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="overflow-hidden text-title font-semibold tracking-[-0.015em] text-ellipsis whitespace-nowrap">
                  {meeting.title}
                </span>
                <span className="text-meta text-muted-foreground">
                  {meeting.itemCount}{" "}
                  {meeting.itemCount === 1 ? "item" : "items"} extracted
                </span>
              </span>
              {/* Hover swaps "1d ago" for the date; both labels share one
                  grid cell so the hover target never moves (no flicker). */}
              <span className="group/when grid flex-none text-right text-meta tabular-nums text-muted-foreground">
                <span className="col-start-1 row-start-1 transition-opacity duration-150 group-hover/when:opacity-0">
                  {timeAgo(meeting.capturedAt)}
                </span>
                <span
                  className="col-start-1 row-start-1 opacity-0 transition-opacity duration-150 group-hover/when:opacity-100"
                  aria-hidden="true"
                >
                  {formatInstantDate(meeting.capturedAt)}
                </span>
              </span>
            </button>
          ))}
          <LoadMoreSentinel
            disabled={!meetingsQuery.hasNextPage}
            loading={meetingsQuery.isFetchingNextPage}
            onVisible={() => {
              if (
                meetingsQuery.hasNextPage &&
                !meetingsQuery.isFetchingNextPage
              ) {
                void meetingsQuery.fetchNextPage();
              }
            }}
          />
        </ScrollRegion>
      )}
      <RecentModal
        meetingId={openMeetingId}
        onClose={() => setOpenMeetingId(null)}
      />
    </ViewShell>
  );
}
