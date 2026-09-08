/** Step 1 of the capture flow: paste notes, AI-extract action items. The
 * extraction is a TanStack mutation; NotesEditor owns the trigger. */
import { NotesEditor } from "./components/notes-editor";
import { StepLabel } from "@/components/app/step-label";
import { ViewShell } from "@/components/app/view-shell";
import { ViewHeader } from "@/components/app/view-header";

/** Title + notes editor. */
export function CaptureView() {
  return (
    <ViewShell className="max-w-[840px]">
      <ViewHeader
        eyebrow={<StepLabel step={1} label="Capture" />}
        title="Paste your meeting notes"
        description="Raw notes, a transcript, or a bulleted recap. Names and dates mentioned anywhere in the text become owners and due dates."
      />
      <NotesEditor />
    </ViewShell>
  );
}
