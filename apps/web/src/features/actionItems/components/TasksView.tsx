import { useActionItems } from "../store";
import { OWNERS, STATUSES } from "../constants";
import { PRIORITY_STYLE, STATUS_STYLE, openItems, taskRows } from "../selectors";
import type { Status } from "../types";

const COLS = "grid-cols-[minmax(0,1fr)_88px_132px]";
const OPEN_STATUSES = STATUSES.slice(0, 3);

export function TasksView() {
  const items = useActionItems((s) => s.items);
  const filterOwner = useActionItems((s) => s.filterOwner);
  const filterStatus = useActionItems((s) => s.filterStatus);
  const setFilterOwner = useActionItems((s) => s.setFilterOwner);
  const setFilterStatus = useActionItems((s) => s.setFilterStatus);
  const clearFilters = useActionItems((s) => s.clearFilters);
  const update = useActionItems((s) => s.update);
  const goTo = useActionItems((s) => s.goTo);

  const rows = taskRows(items, filterOwner, filterStatus);
  const savedCount = openItems(items).length;

  return (
    <div className="n2a-view flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-10">
        <div>
          <h1 className="text-[25px] font-bold leading-[1.12] tracking-[-0.03em]">
            Tasks
          </h1>
          <p className="mt-[7px] text-[13px] text-[#c6cdf3]">
            {rows.length} of {savedCount} open items · completed work moves to{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                goTo("history");
              }}
            >
              History
            </a>
          </p>
        </div>
        <button
          onClick={() => goTo("capture")}
          className="h-10 flex-none rounded-[13px] border-0 bg-[#e930c0] px-[18px] text-[13.5px] font-semibold text-white"
          style={{ boxShadow: "0 8px 22px rgba(233,48,192,.32)" }}
        >
          New capture
        </button>
      </div>

      <div className="my-3 flex items-center gap-[9px]">
        <select
          value={filterOwner}
          onChange={(e) => setFilterOwner(e.target.value)}
          className="h-[38px] min-w-[164px] rounded-[12px] border border-white/[0.16] bg-[#0a1030] px-[13px] text-[13px] text-[#eaeefc]"
        >
          <option value="All">All owners</option>
          {OWNERS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-[38px] min-w-[164px] rounded-[12px] border border-white/[0.16] bg-[#0a1030] px-[13px] text-[13px] text-[#eaeefc]"
        >
          <option value="All">All statuses</option>
          {OPEN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={clearFilters}
          className="h-[38px] rounded-[12px] border border-transparent bg-transparent px-[13px] text-[13px] font-medium text-[#b8c2f2]"
        >
          Clear
        </button>
      </div>

      <div
        className={`grid ${COLS} gap-[14px] px-[18px] pb-[10px] text-[11px] font-semibold tracking-[0.1em] text-[#b8c2f2]`}
      >
        <span>ACTION ITEM</span>
        <span>PRIORITY</span>
        <span>STATUS</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[7px] overflow-x-hidden overflow-y-auto -mr-1 pr-1">
        {rows.map((row) => {
          const pr = PRIORITY_STYLE[row.priority];
          const sc = STATUS_STYLE[row.status];
          return (
            <div
              key={row.id}
              className={`task-row n2a-row grid ${COLS} items-center gap-[14px] rounded-[14px] bg-[#0a1030] px-4 py-[10px]`}
              style={{ animationDelay: row.delay }}
            >
              <span className="flex min-w-0 items-center gap-[11px]">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] bg-white/[0.09] text-[10.5px] font-semibold text-[#c6cdf3]">
                  {row.initials}
                </span>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <span className="overflow-hidden text-[14.5px] font-semibold tracking-[-0.015em] text-ellipsis whitespace-nowrap">
                    {row.title}
                  </span>
                  <span className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap text-[#8b96c8]">
                    {row.owner} ·{" "}
                    <span className="tabular-nums" style={{ color: row.dueFg }}>
                      {row.dueMeta}
                    </span>
                  </span>
                </span>
              </span>
              <span
                className="inline-flex justify-self-start rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold"
                style={{ background: pr.bg, color: pr.fg }}
              >
                {row.priority}
              </span>
              <select
                value={row.status}
                onChange={(e) =>
                  update(row.id, "status", e.target.value as Status)
                }
                className="h-[34px] w-full rounded-[11px] px-[11px] text-[12.5px] font-semibold"
                style={{
                  background: sc.bg,
                  color: sc.fg,
                  border: `1px solid ${sc.border}`,
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="rounded-[16px] bg-[#0a1030] px-5 py-[52px] text-center text-[13.5px] text-[#a7b1e4]">
            No open items match these filters.
          </div>
        )}
      </div>
    </div>
  );
}
