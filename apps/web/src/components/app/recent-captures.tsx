import { useActionItems } from "@/store/actionItems.store";
import { RECENTS } from "@/store/actionItems.constants";

/** Strip of recent-capture shortcuts below the editor; clicking one loads it. */
export function RecentCaptures() {
  const openRecent = useActionItems((s) => s.openRecent);

  return (
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
  );
}
