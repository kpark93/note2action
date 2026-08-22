// Step 2 of the flow: the queue of extracted-but-unsaved items, editable
// inline, with a batch "Save to Tasks" action.
// Path: app.tsx (route "/review") → [this file] → items.queries (domain,
// read + useSaveToTasks optimistic write) → ReviewCard.
// (request-paths.md §2 — optimistic write, via ReviewCard's edits and the
// "Save to Tasks" button below)
import { useNavigate } from "react-router-dom";
import { useItemsQuery, useSaveToTasks } from "@/domain/items/items.queries";
import { useReviewStore } from "./review.store";
import { flagSentence, reviewItems } from "./review.utils";
import { ReviewCard } from "./components/review-card";
import { StepLabel } from "@/components/app/step-label";
import { ViewHeader } from "@/components/app/view-header";
import { EmptyState } from "@/components/app/empty-state";
import { ViewShell } from "@/components/app/view-shell";
import { ScrollRegion } from "@/components/app/scroll-region";
import { Toolbar } from "@/components/app/toolbar";
import { Button } from "@/components/ui/button";

export function ReviewView() {
  const { data, isPending } = useItemsQuery();
  const items = data ?? [];
  const onlyLow = useReviewStore((s) => s.onlyLow);
  const navigate = useNavigate();
  const toggleOnlyLow = useReviewStore((s) => s.toggleOnlyLow);
  const saveToTasks = useSaveToTasks();

  const all = reviewItems(items);
  const flagCount = all.filter((i) => i.low).length;
  const visible = onlyLow ? all.filter((i) => i.low) : all;

  return (
    <ViewShell>
      <ViewHeader
        eyebrow={<StepLabel step={2} label="Review" />}
        title={`${all.length} action items extracted`}
        description={
          <>
            Owners and dates were inferred from the transcript.{" "}
            {flagSentence(flagCount)}
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/capture")}
              className="h-10 rounded-[13px] border-border bg-transparent px-4 text-[13.5px] font-medium text-foreground shadow-none dark:border-border dark:bg-transparent"
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
        <span className="text-[13px] text-muted-foreground">
          {flagCount} need review
        </span>
        <span className="h-[14px] w-px bg-border" />
        <Button
          variant="ghost"
          onClick={toggleOnlyLow}
          className="h-[31px] rounded-full px-[13px] text-[12.5px] font-medium"
          style={{
            background: onlyLow ? "hsl(var(--primary) / 0.15)" : "transparent",
            color: onlyLow
              ? "hsl(var(--pill-blue))"
              : "hsl(var(--muted-foreground))",
            border: `1px solid ${onlyLow ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))"}`,
          }}
        >
          Only low confidence
        </Button>
        <span className="flex-1" />
        <span className="text-[12.5px] text-muted-foreground">
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
      ) : visible.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState>
            No low-confidence items — everything looks confident.
          </EmptyState>
        </div>
      ) : (
        <ScrollRegion className="grid auto-rows-min grid-cols-[repeat(auto-fill,minmax(252px,1fr))] content-start gap-[10px]">
          {visible.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </ScrollRegion>
      )}

      {all.length > 0 && (
        <p className="mt-3 text-[12px] text-muted-foreground">
          {all.length} extracted · owners and dates inferred · edits save when
          you leave a field
        </p>
      )}
    </ViewShell>
  );
}
