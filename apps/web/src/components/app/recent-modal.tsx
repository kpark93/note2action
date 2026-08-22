// Shared transcript-preview dialog, mounted once in app-layout.tsx so it can
// open from any screen. Opened by setting `modalMeetingId` in the extraction
// store (useActionItems) — RecentCaptures (Capture) and MeetingsView both do
// this via openRecent(); this file just renders whatever id is set.
// Path: app-layout.tsx (mounts) ← openRecent() from capture/meetings views
// → [this file] → useMeetingQuery (domain/meetings) for the transcript.
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMeetingQuery } from "@/domain/meetings/meetings.queries";
import { useActionItems } from "@/domain/extraction/extraction.store";
import { timeAgo } from "@/lib/dates";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Full-transcript preview for a recent capture, with a "Load into capture". */
export function RecentModal() {
  const modalMeetingId = useActionItems((s) => s.modalMeetingId);
  const closeModal = useActionItems((s) => s.closeModal);
  const loadTranscript = useActionItems((s) => s.loadTranscript);
  const navigate = useNavigate();

  const open = modalMeetingId !== null;
  // The transcript comes from the API; the query only runs while open.
  const current = useMeetingQuery(modalMeetingId).data ?? null;
  // Keep the last transcript rendered through the close animation so the exit
  // fade doesn't flash an empty modal.
  const lastRef = useRef(current);
  if (current) lastRef.current = current;
  const meeting = current ?? lastRef.current;
  const words = meeting?.rawNotes.trim()
    ? meeting.rawNotes.trim().split(/\s+/).length
    : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeModal();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100vh-4rem)] w-full max-w-[660px] flex-col gap-0 overflow-hidden rounded-[20px] border-border bg-card p-0 sm:max-w-[660px]"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}
      >
        {meeting && (
          <>
            <DialogHeader className="flex flex-row items-start gap-4 space-y-0 border-b border-border px-5 pt-[18px] pb-[14px] text-left">
              <div className="min-w-0">
                <DialogTitle className="text-[17px] font-bold tracking-[-0.02em]">
                  {meeting.title}
                </DialogTitle>
                <DialogDescription className="mt-[5px] text-[12px] text-muted-foreground">
                  {meeting.itemCount} extracted · captured{" "}
                  {timeAgo(meeting.capturedAt)}
                </DialogDescription>
              </div>
              <DialogClose className="ml-auto flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border border-border bg-transparent text-[15px] leading-none text-muted-foreground">
                ×
              </DialogClose>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-[18px] text-[13.5px] leading-[1.75] whitespace-pre-wrap text-foreground">
              {meeting.rawNotes}
            </div>
            <DialogFooter className="flex flex-row items-center gap-[10px] border-t border-border px-5 py-[14px] sm:justify-start">
              <span className="text-[12px] text-muted-foreground">
                {words} words
              </span>
              <span className="flex-1" />
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="h-9 rounded-[11px] border-border bg-transparent px-[15px] text-[13px] font-medium text-muted-foreground shadow-none dark:border-border dark:bg-transparent"
                >
                  Close
                </Button>
              </DialogClose>
              <Button
                onClick={() => {
                  loadTranscript(meeting.title, meeting.rawNotes);
                  navigate("/capture");
                }}
                className="h-9 rounded-[11px] px-4 text-[13px] font-semibold"
                style={{ boxShadow: "0 8px 22px hsl(var(--primary) / 0.3)" }}
              >
                Load into capture
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
