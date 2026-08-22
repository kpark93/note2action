// Row of recent-capture chips below the editor on the Capture screen.
// Clicking one opens the shared RecentModal (in app-layout.tsx) by setting
// modalMeetingId in the extraction store — the same mechanism MeetingsView
// uses for its rows.
// Path: capture.view.tsx → [this file] → meetings.queries (domain, read) /
// extraction.store's openRecent() (domain).
import { useMeetingsQuery } from "@/domain/meetings/meetings.queries";
import { useActionItems } from "@/domain/extraction/extraction.store";
import { timeAgo } from "@/lib/dates";

/** Strip of recent captures below the editor (from the API); click to preview. */
export function RecentCaptures() {
  const meetings = useMeetingsQuery().data ?? [];
  const openRecent = useActionItems((s) => s.openRecent);

  if (meetings.length === 0) return null;

  return (
    <div className="mt-4 flex-none">
      <div className="mb-2 text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground">
        RECENT
      </div>
      <div className="flex gap-2">
        {meetings.map((meeting) => (
          <button
            key={meeting.id}
            onClick={() => openRecent(meeting.id)}
            className="recent-btn flex min-w-0 flex-1 cursor-pointer flex-col gap-1 rounded-[14px] border border-border bg-card px-[14px] py-[11px] text-left text-foreground"
          >
            <span className="w-full overflow-hidden text-[13px] font-semibold text-ellipsis whitespace-nowrap">
              {meeting.title}
            </span>
            <span className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
              {meeting.itemCount} {meeting.itemCount === 1 ? "item" : "items"}
              <span className="text-muted-foreground">
                {timeAgo(meeting.capturedAt)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
