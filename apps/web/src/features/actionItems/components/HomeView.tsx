import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActionItems } from "../store";
import { USER } from "../constants";
import { pendingItems, savedTasks } from "../selectors";

// A few welcome messages; one is chosen at random each time Home mounts.
const GREETINGS = [
  `Hello ${USER.firstName}, welcome back!`,
  `Good to see you again, ${USER.firstName}`,
  `Welcome back, ${USER.firstName}!`,
];

export function HomeView() {
  const items = useActionItems((s) => s.items);
  const navigate = useNavigate();
  const [greeting] = useState(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
  );

  const toReview = pendingItems(items).length;
  const openTasks = savedTasks(items).length;

  const summaryLine =
    toReview === 0 && openTasks === 0
      ? "You're all caught up — nothing to review and no open tasks."
      : `You have ${toReview} ${toReview === 1 ? "item" : "items"} to review and ` +
        `${openTasks} open ${openTasks === 1 ? "task" : "tasks"}.`;

  return (
    <div className="n2a-view flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto -mr-1 pr-1">
      <div className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground">
        HOME
      </div>
      <h1 className="mt-[7px] text-[28px] font-bold leading-[1.1] tracking-[-0.03em]">
        {greeting}
      </h1>
      <p className="mt-[9px] max-w-[60ch] text-[13.5px] leading-[1.5] text-muted-foreground">
        {summaryLine}
      </p>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        <RecapCard
          value={toReview}
          label={`${toReview === 1 ? "task needs" : "tasks need"} reviewing`}
          cta="Go to Review"
          onClick={() => navigate("/review")}
        />
        <RecapCard
          value={openTasks}
          label={`open ${openTasks === 1 ? "task" : "tasks"}`}
          cta="Go to Tasks"
          onClick={() => navigate("/tasks")}
        />
      </div>

      <button
        onClick={() => navigate("/capture")}
        className="mt-6 h-10 w-fit rounded-[13px] border-0 bg-primary px-[18px] text-[13.5px] font-semibold text-primary-foreground"
        style={{ boxShadow: "0 8px 22px hsl(var(--primary) / 0.3)" }}
      >
        New capture
      </button>
    </div>
  );
}

function RecapCard({
  value,
  label,
  cta,
  onClick,
}: {
  value: number;
  label: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="recent-btn flex flex-col items-start gap-1 rounded-[16px] border border-border bg-card px-5 py-[18px] text-left"
    >
      <span className="text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums">
        {value}
      </span>
      <span className="mt-1 text-[13.5px] text-muted-foreground">{label}</span>
      <span className="mt-2 text-[12.5px] font-medium text-primary">
        {cta} →
      </span>
    </button>
  );
}
