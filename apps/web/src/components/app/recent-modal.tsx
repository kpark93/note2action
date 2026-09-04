/** Shared capture-detail dialog, mounted once in app-layout.tsx — opened by
 * setting `modalMeetingId` in the extraction store (openRecent). */
import { useRef } from "react";
import { useMeetingQuery } from "@/domain/meetings/meetings.queries";
import { STATUS_STYLE } from "@/domain/items/items.constants";
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

/** Transcript plus this meeting's extracted items with read-only status
 * pills, both from GET /api/meetings/{id}. */
export function RecentModal() {
  const modalMeetingId = useActionItems((s) => s.modalMeetingId);
  const closeModal = useActionItems((s) => s.closeModal);

  const open = modalMeetingId !== null;
  // Transcript + items arrive together on the detail; only runs while open.
  const current = useMeetingQuery(modalMeetingId).data ?? null;
  // Keep the last capture rendered through the close animation so the exit
  // fade doesn't flash an empty modal.
  const lastRef = useRef(current);
  if (current) lastRef.current = current;
  const meeting = current ?? lastRef.current;
  const items = meeting?.items ?? [];
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
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-[18px]">
              <p className="text-[13.5px] leading-[1.75] whitespace-pre-wrap text-foreground">
                {meeting.rawNotes}
              </p>
              <h3 className="mt-[22px] mb-[10px] text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Extracted items
              </h3>
              {items.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">
                  No items from this meeting are still around.
                </p>
              ) : (
                <ul className="flex flex-col gap-[6px]">
                  {items.map((item) => (
                    <ItemRow
                      key={item.id}
                      title={item.title}
                      status={item.status}
                    />
                  ))}
                </ul>
              )}
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
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** One extracted item: title left, read-only status pill right. */
function ItemRow({
  title,
  status,
}: {
  title: string;
  status: keyof typeof STATUS_STYLE;
}) {
  const sc = STATUS_STYLE[status];
  return (
    <li className="flex items-center gap-3 rounded-[10px] border border-border px-3 py-[8px]">
      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
        {title}
      </span>
      <span
        className="flex-none rounded-full border px-[9px] py-[2px] text-[11px] font-medium"
        style={{
          background: sc.bg,
          color: sc.fg,
          borderColor: sc.border,
        }}
      >
        {status}
      </span>
    </li>
  );
}
