/** Step 2: the unsaved-items queue, editable inline, with batch "Save to Tasks". */
import { useNavigate } from "react-router-dom";
import { useReviewQuery, useSaveToTasks } from "@/domain/items/items.queries";
import { reviewItems, reviewSentence } from "./review.utils";
import { ReviewCard } from "./components/review-card";
import { StepLabel } from "@/components/app/step-label";
import { ViewHeader } from "@/components/app/view-header";
import { EmptyState } from "@/components/app/empty-state";
import { ViewShell } from "@/components/app/view-shell";
import { ScrollRegion } from "@/components/app/scroll-region";
import { Toolbar } from "@/components/app/toolbar";
import { Button } from "@/components/ui/button";

export function ReviewView() {
  const { data, isPending } = useReviewQuery();
  const items = data ?? [];
  const navigate = useNavigate();
  const saveToTasks = useSaveToTasks();

  const all = reviewItems(items);

  return (
    <ViewShell>
      <ViewHeader
        eyebrow={<StepLabel step={2} label="Review" />}
        title={`${all.length} action items extracted`}
        description={
          <>
            Owners and dates were inferred from the transcript.{" "}
            {reviewSentence(all.length)}
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/capture")}
              className="h-10 rounded-[13px] border-border bg-transparent px-4 text-subtitle font-medium text-foreground shadow-none dark:border-border dark:bg-transparent"
            >
              Back to notes
            </Button>
            <Button
              variant="cta"
              onClick={() =>
                saveToTasks.mutate(undefined, {
                  onSuccess: () => navigate("/tasks"),
                })
              }
              disabled={all.length === 0 || saveToTasks.isPending}
              className="disabled:pointer-events-auto disabled:opacity-100"
              style={
                all.length === 0
                  ? {
                      background: "hsl(var(--muted))",
                      color: "hsl(var(--muted-foreground))",
                      boxShadow: "none",
                      cursor: "not-allowed",
                    }
                  : { cursor: "pointer" }
              }
            >
              Save {all.length} to Tasks
            </Button>
          </>
        }
      />

      <Toolbar className="gap-[14px]">
        <span className="text-body-lg text-muted-foreground">
          {all.length} in the queue
        </span>
        <span className="flex-1" />
        <span className="text-body text-muted-foreground">
          Edit any field inline · saves when you leave a field
        </span>
      </Toolbar>

      {isPending ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState title="Loading…">Fetching your items.</EmptyState>
        </div>
      ) : all.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState title="Nothing to review">
            Head to Capture and extract action items from your notes.
          </EmptyState>
        </div>
      ) : (
        // Rows size to the tallest card, so every pinned footer lands level.
        <ScrollRegion className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] content-start gap-[10px]">
          {all.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </ScrollRegion>
      )}

      {all.length > 0 && (
        <p className="mt-3 text-meta text-muted-foreground">
          {all.length} extracted · owners and dates inferred · edits save when
          you leave a field
        </p>
      )}
    </ViewShell>
  );
}
