import { useActionItems } from "../store";
import { RECENTS } from "../constants";

/** Full-transcript preview for a recent capture, with a "Load into capture". */
export function RecentModal() {
  const modalIndex = useActionItems((s) => s.modalIndex);
  const closeModal = useActionItems((s) => s.closeModal);
  const loadRecent = useActionItems((s) => s.loadRecent);

  if (modalIndex === null) return null;
  const r = RECENTS[modalIndex];
  const words = r.text.trim() ? r.text.trim().split(/\s+/).length : 0;

  return (
    <div
      onClick={closeModal}
      className="n2a-overlay fixed inset-0 z-40 flex items-center justify-center bg-[rgba(4,7,22,0.72)] p-8 backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="n2a-modal flex max-h-full w-full max-w-[660px] flex-col overflow-hidden rounded-[20px] border border-white/[0.12] bg-[#0a1030]"
        style={{ boxShadow: "0 30px 80px rgba(2,4,14,.7)" }}
      >
        <div className="flex items-start gap-4 border-b border-white/[0.08] px-5 pt-[18px] pb-[14px]">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold tracking-[-0.02em]">{r.name}</h2>
            <div className="mt-[5px] text-[12px] text-[#8b96c8]">
              {r.count} extracted · captured {r.when}
            </div>
          </div>
          <button
            onClick={closeModal}
            className="ml-auto flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border border-white/[0.16] bg-transparent text-[15px] leading-none text-[#c6cdf3]"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-[18px] text-[13.5px] leading-[1.75] whitespace-pre-wrap text-[#dfe4f8]">
          {r.text}
        </div>
        <div className="flex items-center gap-[10px] border-t border-white/[0.08] px-5 py-[14px]">
          <span className="text-[12px] text-[#7c88b8]">{words} words</span>
          <span className="flex-1" />
          <button
            onClick={closeModal}
            className="h-9 rounded-[11px] border border-white/[0.18] bg-transparent px-[15px] text-[13px] font-medium text-[#c6cdf3]"
          >
            Close
          </button>
          <button
            onClick={loadRecent}
            className="h-9 rounded-[11px] border-0 bg-[#e930c0] px-4 text-[13px] font-semibold text-white"
            style={{ boxShadow: "0 8px 22px rgba(233,48,192,.32)" }}
          >
            Load into capture
          </button>
        </div>
      </div>
    </div>
  );
}
