import { useActionItems } from "../store";
import { RECENTS } from "../constants";

export function CaptureView() {
  const raw = useActionItems((s) => s.raw);
  const meetingTitle = useActionItems((s) => s.meetingTitle);
  const setRaw = useActionItems((s) => s.setRaw);
  const setMeetingTitle = useActionItems((s) => s.setMeetingTitle);
  const loadSample = useActionItems((s) => s.loadSample);
  const openRecent = useActionItems((s) => s.openRecent);
  const goTo = useActionItems((s) => s.goTo);

  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  const ready = words > 12;

  return (
    <div className="n2a-view flex min-h-0 max-w-[840px] flex-1 flex-col overflow-hidden">
      <div className="text-[10.5px] font-semibold tracking-[0.14em] text-[#b8c2f2]">
        STEP 1 OF 3 — CAPTURE
      </div>
      <h1 className="mt-[7px] text-[25px] font-bold leading-[1.12] tracking-[-0.03em]">
        Paste your meeting notes
      </h1>
      <p className="mt-[7px] mb-4 max-w-[64ch] text-[13px] leading-[1.5] text-[#c6cdf3]">
        Raw notes, a transcript, or a bulleted recap. Names and dates mentioned
        anywhere in the text become owners and due dates.
      </p>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#0a1030]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-[18px] py-[14px]">
          <input
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className="-ml-2 w-[320px] rounded-[9px] border border-transparent bg-transparent px-2 py-[5px] text-[14px] font-semibold text-[#f7f8fd]"
          />
          <span className="text-[12px] tabular-nums text-[#7c88b8]">
            {words} words
          </span>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Rachel: we need the pricing page live before the board deck goes out…"
          className="block min-h-0 w-full flex-1 resize-none border-0 bg-[#0a1030] px-[18px] py-4 text-[13.5px] leading-[1.7] text-[#dfe4f8]"
        />
        <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] px-[18px] py-[15px]">
          <button
            onClick={loadSample}
            className="h-[38px] rounded-[12px] border border-white/[0.16] bg-transparent px-[14px] text-[13px] font-medium text-[#c6cdf3]"
          >
            Paste sample notes
          </button>
          <div className="flex items-center gap-[14px]">
            <span className="text-[12.5px] text-[#7c88b8]">
              {ready ? "⌘↵ to extract" : "Paste at least a few lines"}
            </span>
            <button
              onClick={() => goTo("review")}
              disabled={!ready}
              className="h-10 rounded-[13px] border-0 px-5 text-[13.5px] font-semibold"
              style={{
                background: ready ? "#e930c0" : "rgba(255,255,255,.08)",
                color: ready ? "#fff" : "#7c88b8",
                cursor: ready ? "pointer" : "not-allowed",
                boxShadow: ready ? "0 8px 22px rgba(233,48,192,.32)" : "none",
              }}
            >
              Extract action items
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-none">
        <div className="mb-2 text-[10.5px] font-semibold tracking-[0.14em] text-[#b8c2f2]">
          RECENT
        </div>
        <div className="flex gap-2">
          {RECENTS.map((r, i) => (
            <button
              key={r.name}
              onClick={() => openRecent(i)}
              className="recent-btn flex min-w-0 flex-1 cursor-pointer flex-col gap-1 rounded-[14px] border border-white/[0.08] bg-[#0a1030] px-[14px] py-[11px] text-left text-[#f2f4fb]"
            >
              <span className="w-full overflow-hidden text-[13px] font-semibold text-ellipsis whitespace-nowrap">
                {r.name}
              </span>
              <span className="flex items-center gap-2 text-[11.5px] text-[#8b96c8]">
                {r.count}
                <span className="text-[#6d7ab0]">{r.when}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
