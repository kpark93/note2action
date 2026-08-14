import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useActionItems } from "@/store/actionItems.store";
import { OWNERS, RECENTS } from "@/store/actionItems.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CaptureView() {
  const navigate = useNavigate();
  const raw = useActionItems((s) => s.raw);
  const meetingTitle = useActionItems((s) => s.meetingTitle);
  const setRaw = useActionItems((s) => s.setRaw);
  const setMeetingTitle = useActionItems((s) => s.setMeetingTitle);
  const loadSample = useActionItems((s) => s.loadSample);
  const openRecent = useActionItems((s) => s.openRecent);
  const extractNotes = useActionItems((s) => s.extractNotes);
  const busy = useActionItems((s) => s.extracting);
  const extractError = useActionItems((s) => s.extractError);

  // Extraction runs in the store (so it survives navigation). When it finishes
  // successfully and we're still on Capture, move to Review.
  const wasBusy = useRef(false);
  useEffect(() => {
    if (wasBusy.current && !busy && !extractError) navigate("/review");
    wasBusy.current = busy;
  }, [busy, extractError, navigate]);

  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  const ready = words > 12;
  const canExtract = ready && !busy;

  const onExtract = () =>
    extractNotes({
      notes: raw,
      meetingTitle,
      today: new Date().toISOString().slice(0, 10),
      owners: [...OWNERS],
    });

  return (
    <div className="n2a-view flex min-h-0 max-w-[840px] flex-1 flex-col overflow-hidden">
      <div className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground">
        STEP 1 OF 3 — CAPTURE
      </div>
      <h1 className="mt-[7px] text-[25px] font-bold leading-[1.12] tracking-[-0.03em]">
        Paste your meeting notes
      </h1>
      <p className="mt-[7px] mb-4 max-w-[64ch] text-[13px] leading-[1.5] text-muted-foreground">
        Raw notes, a transcript, or a bulleted recap. Names and dates mentioned
        anywhere in the text become owners and due dates.
      </p>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-[18px] py-[14px]">
          <Input
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className="-ml-2 h-auto w-[320px] rounded-[9px] border-transparent bg-transparent px-2 py-[5px] text-[14px] font-semibold text-foreground shadow-none md:text-[14px] dark:bg-transparent"
          />
          <span className="text-[12px] tabular-nums text-muted-foreground">
            {words} words
          </span>
        </div>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Rachel: we need the pricing page live before the board deck goes out…"
          className="field-sizing-fixed block min-h-0 w-full flex-1 resize-none rounded-none border-0 bg-card px-[18px] py-4 text-[13.5px] leading-[1.7] text-foreground shadow-none focus-visible:ring-0 md:text-[13.5px] dark:bg-card"
        />
        <div className="flex items-center justify-between gap-4 border-t border-border px-[18px] py-[15px]">
          <Button
            variant="outline"
            onClick={loadSample}
            className="h-[38px] rounded-[12px] border-border bg-transparent px-[14px] text-[13px] font-medium text-muted-foreground shadow-none dark:border-border dark:bg-transparent"
          >
            Paste sample notes
          </Button>
          <div className="flex items-center gap-[14px]">
            <span
              className="text-[12.5px]"
              style={{
                color: extractError
                  ? "hsl(var(--destructive))"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              {extractError ? (
                "Extraction failed — is the AI app running (and API key set)?"
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
              onClick={onExtract}
              disabled={!canExtract}
              className="h-10 rounded-[13px] px-5 text-[13.5px] font-semibold disabled:pointer-events-auto disabled:opacity-100"
              style={{
                background: ready ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: ready
                  ? "hsl(var(--primary-foreground))"
                  : "hsl(var(--muted-foreground))",
                cursor: canExtract ? "pointer" : busy ? "wait" : "not-allowed",
                boxShadow: ready ? "0 8px 22px hsl(var(--primary) / 0.3)" : "none",
                opacity: busy ? 0.85 : 1,
              }}
            >
              {busy ? "Extracting…" : "Extract action items"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-none">
        <div className="mb-2 text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground">
          RECENT
        </div>
        <div className="flex gap-2">
          {RECENTS.map((r, i) => (
            <button
              key={r.name}
              onClick={() => openRecent(i)}
              className="recent-btn flex min-w-0 flex-1 cursor-pointer flex-col gap-1 rounded-[14px] border border-border bg-card px-[14px] py-[11px] text-left text-foreground"
            >
              <span className="w-full overflow-hidden text-[13px] font-semibold text-ellipsis whitespace-nowrap">
                {r.name}
              </span>
              <span className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                {r.count}
                <span className="text-muted-foreground">{r.when}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
