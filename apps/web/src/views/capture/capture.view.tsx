// Step 1 of the capture flow: paste notes, then AI-extract action items.
// The editor/extraction call live in the extraction store (useActionItems)
// — this view just watches `extracting` to move on to Review.
// Path: [this file] → NotesEditor → extraction.store (request-paths.md §3)
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useActionItems } from "@/domain/extraction/extraction.store";
import { NotesEditor } from "./components/notes-editor";
import { RecentCaptures } from "./components/recent-captures";
import { StepLabel } from "@/components/app/step-label";
import { ViewShell } from "@/components/app/view-shell";
import { ViewHeader } from "@/components/app/view-header";

/**
 * Capture screen: title + notes editor, recent captures strip. Redirects to
 * /review once an in-flight extraction finishes successfully.
 */
export function CaptureView() {
  const navigate = useNavigate();
  const busy = useActionItems((s) => s.extracting);
  const extractError = useActionItems((s) => s.extractError);

  // Extraction runs in the store (so it survives navigation). When it finishes
  // successfully and we're still on Capture, move to Review.
  const wasBusy = useRef(false);
  useEffect(() => {
    if (wasBusy.current && !busy && !extractError) navigate("/review");
    wasBusy.current = busy;
  }, [busy, extractError, navigate]);

  return (
    <ViewShell className="max-w-[840px]">
      <ViewHeader
        eyebrow={<StepLabel step={1} label="Capture" />}
        title="Paste your meeting notes"
        description="Raw notes, a transcript, or a bulleted recap. Names and dates mentioned anywhere in the text become owners and due dates."
      />
      <NotesEditor />
      <RecentCaptures />
    </ViewShell>
  );
}
