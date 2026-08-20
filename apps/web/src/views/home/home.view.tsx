import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useItemsQuery } from "@/lib/items.queries";
import { pendingItems, savedTasks } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { ViewShell } from "@/components/app/view-shell";
import { RecapCard } from "@/components/app/recap-card";

// A few welcome messages; one is chosen at random each time Home mounts.
// Templates, not strings: the name comes from the signed-in Clerk user.
const GREETINGS = [
  (name: string) => `Hello ${name}, welcome back!`,
  (name: string) => `Good to see you again, ${name}`,
  (name: string) => `Welcome back, ${name}!`,
];

export function HomeView() {
  const items = useItemsQuery().data ?? [];
  const navigate = useNavigate();
  const { user } = useUser();
  const firstName = user?.firstName ?? "there";
  const [greet] = useState(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
  );
  const greeting = greet(firstName);

  const toReview = pendingItems(items).length;
  const openTasks = savedTasks(items).length;

  const summaryLine =
    toReview === 0 && openTasks === 0
      ? "You're all caught up — nothing to review and no open tasks."
      : `You have ${toReview} ${toReview === 1 ? "item" : "items"} to review and ` +
        `${openTasks} open ${openTasks === 1 ? "task" : "tasks"}.`;

  return (
    <ViewShell className="overflow-x-hidden overflow-y-auto -mr-1 pr-1">
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

      <Button
        variant="cta"
        onClick={() => navigate("/capture")}
        className="mt-6 w-fit"
      >
        New capture
      </Button>
    </ViewShell>
  );
}
