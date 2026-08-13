import type { CSSProperties } from "react";
import { useActionItems } from "../store";
import { OWNERS } from "../constants";
import { flagSentence, reviewItems, reviewStyle } from "../selectors";
import type { Priority } from "../types";
import type { ReviewItemVM as VM } from "../selectors";

export function ReviewView() {
  const items = useActionItems((s) => s.items);
  const onlyLow = useActionItems((s) => s.onlyLow);
  const goTo = useActionItems((s) => s.goTo);
  const toggleOnlyLow = useActionItems((s) => s.toggleOnlyLow);
  const saveToTasks = useActionItems((s) => s.saveToTasks);

  const all = reviewItems(items);
  const flagCount = all.filter((i) => i.low).length;
  const visible = onlyLow ? all.filter((i) => i.low) : all;

  return (
    <div className="n2a-view flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-10">
        <div>
          <div className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground">
            STEP 2 OF 3 — REVIEW
          </div>
          <h1 className="mt-[7px] text-[25px] font-bold leading-[1.12] tracking-[-0.03em]">
            {all.length} action items extracted
          </h1>
          <p className="mt-[7px] max-w-[70ch] text-[13px] leading-[1.5] text-muted-foreground">
            Owners and dates were inferred from the transcript.{" "}
            {flagSentence(flagCount)}
          </p>
        </div>
        <div className="flex flex-none items-center gap-[10px]">
          <button
            onClick={() => goTo("capture")}
            className="h-10 rounded-[13px] border border-border bg-transparent px-4 text-[13.5px] font-medium text-foreground"
          >
            Back to notes
          </button>
          <button
            onClick={saveToTasks}
            disabled={all.length === 0}
            className="h-10 rounded-[13px] border-0 px-[18px] text-[13.5px] font-semibold"
            style={{
              background:
                all.length === 0 ? "hsl(var(--muted))" : "hsl(var(--primary))",
              color:
                all.length === 0
                  ? "hsl(var(--muted-foreground))"
                  : "hsl(var(--primary-foreground))",
              cursor: all.length === 0 ? "not-allowed" : "pointer",
              boxShadow:
                all.length === 0
                  ? "none"
                  : "0 8px 22px hsl(var(--primary) / 0.3)",
            }}
          >
            Save {all.length} to Tasks
          </button>
        </div>
      </div>

      <div className="my-3 flex items-center gap-[14px]">
        <span className="text-[13px] text-muted-foreground">{flagCount} need review</span>
        <span className="h-[14px] w-px bg-border" />
        <button
          onClick={toggleOnlyLow}
          className="h-[31px] rounded-full px-[13px] text-[12.5px] font-medium"
          style={{
            background: onlyLow ? "rgba(233,48,192,.18)" : "transparent",
            color: onlyLow ? "#f9a3e9" : "hsl(var(--muted-foreground))",
            border: `1px solid ${onlyLow ? "rgba(233,48,192,.5)" : "hsl(var(--border))"}`,
          }}
        >
          Only low confidence
        </button>
        <span className="flex-1" />
        <span className="text-[12.5px] text-muted-foreground">
          Edit any field inline · saves as you type
        </span>
      </div>

      {all.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="rounded-[20px] border border-dashed border-border bg-card px-6 py-[52px] text-center">
            <div className="text-[15px] font-semibold">Nothing to review</div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Head to Capture and extract action items from your notes.
            </p>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="rounded-[20px] border border-dashed border-border bg-card px-6 py-[52px] text-center text-[13.5px] text-muted-foreground">
            No low-confidence items — everything looks confident.
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(252px,1fr))] content-start gap-[10px] overflow-x-hidden overflow-y-auto -mr-1 pr-1">
          {visible.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {all.length > 0 && (
        <p className="mt-3 text-[12px] text-muted-foreground">
          {all.length} extracted · owners and dates inferred · edits save as you
          type
        </p>
      )}
    </div>
  );
}

function ReviewCard({ item }: { item: VM }) {
  const update = useActionItems((s) => s.update);
  const confirm = useActionItems((s) => s.confirm);
  const discard = useActionItems((s) => s.discard);
  const st = reviewStyle(item.low);

  return (
    <article
      className="review-card n2a-card rounded-[16px] bg-card px-[13px] py-3"
      style={
        {
          border: `1px solid ${st.cardBorder}`,
          boxShadow: st.cardShadow,
          animationDelay: item.delay,
          "--hover-shadow": st.hoverShadow,
          "--hover-border": st.hoverBorder,
        } as CSSProperties
      }
    >
      <div className="mb-[9px] flex items-center gap-[10px]">
        <span
          className="flex flex-none items-center gap-[7px] rounded-full px-[10px] py-1 whitespace-nowrap"
          style={{
            background: st.pillBg,
            border: `1px solid ${st.pillBorder}`,
          }}
        >
          <span
            className="h-[6px] w-[6px] rounded-full"
            style={{ background: st.dot }}
          />
          <span
            className="text-[11.5px] font-semibold tabular-nums"
            style={{ color: st.pillFg }}
          >
            {item.pct}
          </span>
          <span className="text-[11.5px] font-medium" style={{ color: st.pillFg }}>
            {st.label}
          </span>
        </span>
        <span className="ml-auto min-w-0 overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap text-muted-foreground">
          {item.meeting}
        </span>
      </div>

      <textarea
        value={item.title}
        onChange={(e) => update(item.id, "title", e.target.value)}
        rows={2}
        className="review-title mb-[9px] block min-h-[38px] w-full resize-none overflow-hidden rounded-[11px] border border-transparent bg-transparent px-[7px] py-[5px] text-[14.5px] leading-[1.35] font-semibold tracking-[-0.02em] text-foreground"
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-[9px]">
        <label className="flex flex-col gap-[6px]">
          <span className="text-[11px] font-medium text-muted-foreground">Owner</span>
          <select
            value={item.owner}
            onChange={(e) => update(item.id, "owner", e.target.value)}
            className="h-8 rounded-[10px] border border-border bg-secondary px-2 text-[12.5px] text-foreground"
          >
            {OWNERS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-[9px]">
          <label className="flex min-w-0 flex-col gap-[6px]">
            <span className="text-[11px] font-medium text-muted-foreground">Due</span>
            <input
              type="date"
              value={item.due}
              onChange={(e) => update(item.id, "due", e.target.value)}
              className="h-8 rounded-[10px] border border-border bg-secondary px-2 text-[12.5px] text-foreground"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-[6px]">
            <span className="text-[11px] font-medium text-muted-foreground">
              Priority
            </span>
            <select
              value={item.priority}
              onChange={(e) =>
                update(item.id, "priority", e.target.value as Priority)
              }
              className="h-8 rounded-[10px] border border-border bg-secondary px-2 text-[12.5px] text-foreground"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-[11px] flex items-center gap-[10px] border-t border-border pt-[10px]">
        <span
          className="min-w-0 flex-1 text-[12.5px] leading-[1.5]"
          style={{ color: st.noteFg }}
        >
          {item.note}
        </span>
        <span className="flex w-[82px] flex-none flex-col gap-[6px]">
          {item.low && (
            <button
              onClick={() => confirm(item.id)}
              className="h-[29px] w-full rounded-[9px] border-0 bg-primary text-[12.5px] font-semibold text-primary-foreground"
            >
              Confirm
            </button>
          )}
          <button
            onClick={() => discard(item.id)}
            className="h-[29px] w-full rounded-[9px] border border-border bg-transparent text-[12.5px] font-medium text-muted-foreground"
          >
            Discard
          </button>
        </span>
      </div>
    </article>
  );
}
