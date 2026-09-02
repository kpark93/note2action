/** The title + textarea card on Capture, plus its Extract button. Next hop:
 * extraction.store's extractNotes() → POST /ai-api/extract, then /api/meetings. */
import { useRef, useState, type ChangeEvent } from "react";
import { useActionItems } from "@/domain/extraction/extraction.store";
import { OWNERS } from "@/domain/items/items.constants";
import { todayISO } from "@/lib/dates";
import {
  isTxtFilename,
  titleFromFilename,
} from "@/views/capture/capture.utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Editor card: title input, notes textarea, and the footer (.txt upload,
 * status, Extract button). Reads/writes the store directly. */
export function NotesEditor() {
  const raw = useActionItems((s) => s.raw);
  const meetingTitle = useActionItems((s) => s.meetingTitle);
  const setRaw = useActionItems((s) => s.setRaw);
  const setMeetingTitle = useActionItems((s) => s.setMeetingTitle);
  const extractNotes = useActionItems((s) => s.extractNotes);
  const busy = useActionItems((s) => s.extracting);
  const extractError = useActionItems((s) => s.extractError);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  const ready = words > 12;
  const canExtract = ready && !busy;

  const shownError = extractError
    ? // Surface the real error: it names which leg failed (the AI
      // app on :3000, or the API on :8001 persisting the capture).
      `${extractError} — check the AI app and API terminals.`
    : busy
      ? null
      : uploadError;

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // re-picking the same file must re-fire onChange
    if (!file) return;
    // The picker's accept filter is advisory — the real .txt gate is here.
    if (!isTxtFilename(file.name)) {
      setUploadError("Only .txt files are supported");
      return;
    }
    try {
      const text = await file.text();
      setRaw(text);
      setMeetingTitle(titleFromFilename(file.name));
      setUploadError(null);
    } catch {
      setUploadError("Couldn't read that file");
    }
  };

  const onExtract = () =>
    extractNotes({
      notes: raw,
      meetingTitle,
      today: todayISO(),
      owners: [...OWNERS],
    });

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-[18px] py-[14px]">
        <Input
          value={meetingTitle}
          placeholder="Meeting title"
          onChange={(e) => setMeetingTitle(e.target.value)}
          className="-ml-2 h-auto w-[320px] rounded-[9px] border-transparent bg-transparent px-2 py-[5px] text-[14px] font-semibold text-foreground shadow-none md:text-[14px] dark:bg-transparent"
        />
        <span className="text-[12px] tabular-nums text-muted-foreground">
          {words} words
        </span>
      </div>
      <Textarea
        value={raw}
        onChange={(e) => {
          setUploadError(null);
          setRaw(e.target.value);
        }}
        placeholder="Paste your meeting notes here…"
        className="field-sizing-fixed block min-h-0 w-full flex-1 resize-none rounded-none border-0 bg-card px-[18px] py-4 text-[13.5px] leading-[1.7] text-foreground shadow-none focus-visible:ring-0 md:text-[13.5px] dark:bg-card"
      />
      <div className="flex items-center justify-between gap-4 border-t border-border px-[18px] py-[15px]">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={onFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="h-[38px] rounded-[12px] border-border bg-transparent px-[14px] text-[13px] font-medium text-muted-foreground shadow-none dark:border-border dark:bg-transparent"
        >
          Upload notes (.txt)
        </Button>
        <div className="flex items-center gap-[14px]">
          <span
            className="text-[12.5px]"
            style={{
              color: shownError
                ? "hsl(var(--destructive))"
                : "hsl(var(--muted-foreground))",
            }}
          >
            {shownError ? (
              shownError
            ) : busy ? (
              <>
                Reading your notes
                <span className="loading-dots" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </>
            ) : ready ? (
              "AI extracts owner, priority, due date & confidence"
            ) : (
              "Paste at least a few lines"
            )}
          </span>
          <Button
            variant="cta"
            onClick={onExtract}
            disabled={!canExtract}
            className="disabled:pointer-events-auto disabled:opacity-100"
            style={{
              ...(ready
                ? {}
                : {
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                    boxShadow: "none",
                  }),
              cursor: canExtract ? "pointer" : busy ? "wait" : "not-allowed",
              opacity: busy ? 0.85 : 1,
            }}
          >
            {busy ? "Extracting…" : "Extract action items"}
          </Button>
        </div>
      </div>
    </div>
  );
}
