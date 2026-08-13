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

  const all = reviewItems(items);
  const flagCount = all.filter((i) => i.low).length;
  const visible = onlyLow ? all.filter((i) => i.low) : all;

  return (
    <div className="n2a-view flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-10">
        <div>
          <div className="text-[10.5px] font-semibold tracking-[0.14em] text-[#b8c2f2]">
            STEP 2 OF 3 — REVIEW
          </div>
          <h1 className="mt-[7px] text-[25px] font-bold leading-[1.12] tracking-[-0.03em]">
            {all.length} action items extracted
          </h1>
          <p className="mt-[7px] max-w-[70ch] text-[13px] leading-[1.5] text-[#c6cdf3]">
            Owners and dates were inferred from the transcript.{" "}
            {flagSentence(flagCount)}
          </p>
        </div>
        <div className="flex flex-none items-center gap-[10px]">
          <button
            onClick={() => goTo("capture")}
            className="h-10 rounded-[13px] border border-white/[0.22] bg-transparent px-4 text-[13.5px] font-medium text-[#eaeefc]"
          >
            Back to notes
          </button>
          <button
            onClick={() => goTo("tasks")}
            className="h-10 rounded-[13px] border-0 bg-[#e930c0] px-[18px] text-[13.5px] font-semibold text-white"
            style={{ boxShadow: "0 8px 22px rgba(233,48,192,.32)" }}
          >
            Save {all.length} to Tasks
          </button>
        </div>
      </div>

      <div className="my-3 flex items-center gap-[14px]">
        <span className="text-[13px] text-[#c6cdf3]">{flagCount} need review</span>
        <span className="h-[14px] w-px bg-white/20" />
        <button
          onClick={toggleOnlyLow}
          className="h-[31px] rounded-full px-[13px] text-[12.5px] font-medium"
          style={{
            background: onlyLow ? "rgba(233,48,192,.18)" : "transparent",
            color: onlyLow ? "#f9a3e9" : "#c6cdf3",
            border: `1px solid ${onlyLow ? "rgba(233,48,192,.5)" : "rgba(255,255,255,.2)"}`,
          }}
        >
          Only low confidence
        </button>
        <span className="flex-1" />
        <span className="text-[12.5px] text-[#a7b1e4]">
          Edit any field inline · saves as you type
        </span>
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(252px,1fr))] content-start gap-[10px] overflow-x-hidden overflow-y-auto -mr-1 pr-1">
        {visible.map((item) => (
          <ReviewCard key={item.id} item={item} />
        ))}
      </div>

      <p className="mt-3 text-[12px] text-[#a7b1e4]">
        Source:{" "}
        <a href="#" onClick={(e) => e.preventDefault()}>
          Weekly Sync — Aug 10 transcript
        </a>{" "}
        · 1,284 words · extracted in 2.1s
      </p>
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
      className="review-card n2a-card rounded-[16px] bg-[#0a1030] px-[13px] py-3"
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
        <span className="ml-auto min-w-0 overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap text-[#6d7ab0]">
          {item.meeting}
        </span>
      </div>

      <textarea
        value={item.title}
        onChange={(e) => update(item.id, "title", e.target.value)}
        rows={2}
        className="review-title mb-[9px] block min-h-[38px] w-full resize-none overflow-hidden rounded-[11px] border border-transparent bg-transparent px-[7px] py-[5px] text-[14.5px] leading-[1.35] font-semibold tracking-[-0.02em] text-[#f7f8fd]"
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-[9px]">
        <label className="flex flex-col gap-[6px]">
          <span className="text-[11px] font-medium text-[#7c88b8]">Owner</span>
          <select
            value={item.owner}
            onChange={(e) => update(item.id, "owner", e.target.value)}
            className="h-8 rounded-[10px] border border-white/[0.13] bg-[#111a45] px-2 text-[12.5px] text-[#eaeefc]"
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
            <span className="text-[11px] font-medium text-[#7c88b8]">Due</span>
            <input
              type="date"
              value={item.due}
              onChange={(e) => update(item.id, "due", e.target.value)}
              className="h-8 rounded-[10px] border border-white/[0.13] bg-[#111a45] px-2 text-[12.5px] text-[#eaeefc]"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-[6px]">
            <span className="text-[11px] font-medium text-[#7c88b8]">
              Priority
            </span>
            <select
              value={item.priority}
              onChange={(e) =>
                update(item.id, "priority", e.target.value as Priority)
              }
              className="h-8 rounded-[10px] border border-white/[0.13] bg-[#111a45] px-2 text-[12.5px] text-[#eaeefc]"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-[11px] flex items-center gap-[10px] border-t border-white/[0.08] pt-[10px]">
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
              className="h-[29px] w-full rounded-[9px] border-0 bg-[#e930c0] text-[12.5px] font-semibold text-white"
            >
              Confirm
            </button>
          )}
          <button
            onClick={() => discard(item.id)}
            className="h-[29px] w-full rounded-[9px] border border-white/[0.16] bg-transparent text-[12.5px] font-medium text-[#a7b1e4]"
          >
            Discard
          </button>
        </span>
      </div>
    </article>
  );
}
