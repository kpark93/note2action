import { useNavigate } from "react-router-dom";
import { useActionItems } from "../store";
import { RECENTS } from "../constants";

/** Full-transcript preview for a recent capture, with a "Load into capture". */
export function RecentModal() {
  const modalIndex = useActionItems((s) => s.modalIndex);
  const closeModal = useActionItems((s) => s.closeModal);
  const loadRecent = useActionItems((s) => s.loadRecent);
  const navigate = useNavigate();

  if (modalIndex === null) return null;
  const r = RECENTS[modalIndex];
  const words = r.text.trim() ? r.text.trim().split(/\s+/).length : 0;

  return (
    <div
      onClick={closeModal}
      className="n2a-overlay fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-8 backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="n2a-modal flex max-h-full w-full max-w-[660px] flex-col overflow-hidden rounded-[20px] border border-border bg-card"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}
      >
        <div className="flex items-start gap-4 border-b border-border px-5 pt-[18px] pb-[14px]">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold tracking-[-0.02em]">{r.name}</h2>
            <div className="mt-[5px] text-[12px] text-muted-foreground">
              {r.count} extracted · captured {r.when}
            </div>
          </div>
          <button
            onClick={closeModal}
            className="ml-auto flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border border-border bg-transparent text-[15px] leading-none text-muted-foreground"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-[18px] text-[13.5px] leading-[1.75] whitespace-pre-wrap text-foreground">
          {r.text}
        </div>
        <div className="flex items-center gap-[10px] border-t border-border px-5 py-[14px]">
          <span className="text-[12px] text-muted-foreground">{words} words</span>
          <span className="flex-1" />
          <button
            onClick={closeModal}
            className="h-9 rounded-[11px] border border-border bg-transparent px-[15px] text-[13px] font-medium text-muted-foreground"
          >
            Close
          </button>
          <button
            onClick={() => {
              loadRecent();
              navigate("/capture");
            }}
            className="h-9 rounded-[11px] border-0 bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
            style={{ boxShadow: "0 8px 22px hsl(var(--primary) / 0.3)" }}
          >
            Load into capture
          </button>
        </div>
      </div>
    </div>
  );
}
