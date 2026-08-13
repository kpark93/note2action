import { useActionItems } from "../store";
import { OWNERS } from "../constants";
import { historyGroups, historyStats } from "../selectors";

const ROW_COLS = "grid-cols-[minmax(0,2fr)_minmax(0,1fr)_88px_88px]";

export function HistoryView() {
  const items = useActionItems((s) => s.items);
  const historyOwner = useActionItems((s) => s.historyOwner);
  const setHistoryOwner = useActionItems((s) => s.setHistoryOwner);
  const update = useActionItems((s) => s.update);

  const groups = historyGroups(items, historyOwner);
  const stats = historyStats(items);

  return (
    <div className="n2a-view flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-10">
        <div>
          <h1 className="text-[25px] font-bold leading-[1.12] tracking-[-0.03em]">
            History
          </h1>
          <p className="mt-[7px] max-w-[64ch] text-[13px] text-muted-foreground">
            Completed action items, newest first. Nothing is deleted — reopen
            anything that comes back.
          </p>
        </div>
        <select
          value={historyOwner}
          onChange={(e) => setHistoryOwner(e.target.value)}
          className="h-[38px] min-w-[164px] flex-none rounded-[12px] border border-border bg-card px-[13px] text-[13px] text-foreground"
        >
          <option value="All">All owners</option>
          {OWNERS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="my-4 grid flex-none grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[16px] bg-card px-4 py-[13px]">
            <div className="text-[12.5px] text-muted-foreground">{s.label}</div>
            <div className="mt-[6px] text-[23px] font-bold tracking-[-0.035em] tabular-nums">
              {s.value}
            </div>
            <div className="mt-[9px] h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="n2a-bar h-full rounded-full"
                style={{ width: s.bar, background: s.barColor }}
              />
            </div>
            <div className="mt-[7px] text-[11px] text-muted-foreground">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-x-hidden overflow-y-auto -mr-1 pr-1">
        {groups.map((g) => (
          <section key={g.key}>
            <div className="mb-[7px] flex items-center gap-3">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {g.label}
              </h2>
              <span className="h-px flex-1 bg-white/[0.14]" />
              <span className="text-[12px] text-muted-foreground">{g.count}</span>
            </div>
            <div className="flex flex-col gap-[6px]">
              {g.items.map((h) => (
                <div
                  key={h.id}
                  className={`history-row grid ${ROW_COLS} items-center gap-3 rounded-[13px] bg-card px-4 py-[9px]`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      ✓
                    </span>
                    <span className="overflow-hidden text-[14.5px] font-medium text-ellipsis whitespace-nowrap text-muted-foreground line-through decoration-muted-foreground/50">
                      {h.title}
                    </span>
                  </span>
                  <span className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-foreground">
                    {h.owner}
                  </span>
                  <span className="text-[12.5px] tabular-nums text-muted-foreground">
                    {h.completedLabel}
                  </span>
                  <button
                    onClick={() => update(h.id, "status", "In progress")}
                    className="h-[31px] justify-self-end rounded-[10px] border border-border bg-transparent px-[13px] text-[12.5px] font-medium text-muted-foreground"
                  >
                    Reopen
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <div className="rounded-[20px] border border-dashed border-border bg-card px-5 py-[60px] text-center">
            <div className="text-[15px] font-semibold">Nothing completed yet</div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Mark a task Done and it lands here with the date it was closed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
