# shadcn Div-to-Component Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace repeated hand-styled divs in `apps/web` with shadcn-based components in `apps/web/src/components/`, slimming hardcoded style values.

**Architecture:** Five independent conversions: a `ViewHeader` composing the repeated page-header recipe; a `StatCard` built on shadcn `Card` plus a new `Progress` primitive; `PriorityBadge` and `ConfidencePill` built on the existing `Badge` primitive; and a `cta` variant added to `ui/button.tsx` for the glowing primary button recipe. Markup moves verbatim except for normalizations this plan names explicitly.

**Tech Stack:** React 19, TypeScript, Tailwind v4, shadcn/ui (cva + tailwind-merge), unified `radix-ui` package, Vite.

**Spec:** No spec file — design approved in chat 2026-08-14 (bounded task). This plan is the authority; its Global Constraints carry the binding requirements.

## Global Constraints

- Commit messages: conventional style (`refactor(web): …` / `feat(web): …`). **NEVER add `Co-Authored-By`, `Signed-off-by`, or any AI/assistant mention in commit messages** (binding repo rule: `.cursor/rules/no-ai-commit-attribution.mdc`). Do not push.
- Verification per task (no unit-test runner exists in `apps/web`; do not add one): `pnpm --filter @note2action/web lint` (runs `tsc --noEmit`) and `pnpm --filter @note2action/web build` must both pass.
- This repo has a Stop hook requiring a journal entry in `memory.md` (repo root) after editing files. Before finishing, append (never delete earlier entries) an entry starting `## 2026-08-14 — <short title>` explaining WHAT changed, WHICH files (paths), WHY — written for a programming beginner, defining each technical term at first use.
- Existing look must be preserved pixel-for-pixel except these approved normalizations: (a) header descriptions unify to `max-w-[70ch]` + `leading-[1.5]`; (b) History h1 gains no top margin (eyebrow-less); (c) the Extract button's horizontal padding goes from `px-5` to the cta variant's `px-[18px]`.
- Import Radix via the unified package, matching existing files: `import { X as XPrimitive } from "radix-ui"`.
- New components live in `apps/web/src/components/` (primitives in `components/ui/`), PascalCase filenames matching existing siblings (`StepLabel.tsx`, `EmptyState.tsx`).
- Use the `@/` path alias for cross-directory imports, matching existing files.

---

### Task 1: ViewHeader component + adopt in Review, Tasks, History, Capture

**Files:**

- Create: `apps/web/src/components/ViewHeader.tsx`
- Modify: `apps/web/src/views/review/review.view.tsx`
- Modify: `apps/web/src/views/tasks/tasks.view.tsx`
- Modify: `apps/web/src/views/history/history.view.tsx`
- Modify: `apps/web/src/views/capture/capture.view.tsx`

**Interfaces:**

- Consumes: `StepLabel` from `@/components/StepLabel` (exists; renders eyebrow text).
- Produces: `ViewHeader({ eyebrow?, title, description?, actions? }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode })` — later tasks do not depend on it.

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/ViewHeader.tsx
import type { ReactNode } from "react";

interface ViewHeaderProps {
  /** Small slot above the title, e.g. <StepLabel />. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Muted paragraph under the title. */
  description?: ReactNode;
  /** Right-aligned header actions (buttons, filters). */
  actions?: ReactNode;
}

/** Standard page header: eyebrow + 25px title + muted description left, actions right. */
export function ViewHeader({
  eyebrow,
  title,
  description,
  actions,
}: ViewHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-10">
      <div>
        {eyebrow}
        <h1
          className={`text-[25px] font-bold leading-[1.12] tracking-[-0.03em]${eyebrow ? " mt-[7px]" : ""}`}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-[7px] max-w-[70ch] text-[13px] leading-[1.5] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-none items-center gap-[10px]">{actions}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Adopt in review.view.tsx**

Replace the header block (the outer `<div className="flex items-start justify-between gap-10">` through its closing tag — contains StepLabel, h1, p, and the two buttons) with:

```tsx
<ViewHeader
  eyebrow={<StepLabel step={2} label="Review" />}
  title={`${all.length} action items extracted`}
  description={
    <>
      Owners and dates were inferred from the transcript.{" "}
      {flagSentence(flagCount)}
    </>
  }
  actions={
    <>
      <Button
        variant="outline"
        onClick={() => navigate("/capture")}
        className="h-10 rounded-[13px] border-border bg-transparent px-4 text-[13.5px] font-medium text-foreground shadow-none dark:border-border dark:bg-transparent"
      >
        Back to notes
      </Button>
      <Button
        onClick={() => {
          saveToTasks();
          navigate("/tasks");
        }}
        disabled={all.length === 0}
        className="h-10 rounded-[13px] px-[18px] text-[13.5px] font-semibold disabled:pointer-events-auto disabled:opacity-100"
        style={{
          background:
            all.length === 0 ? "hsl(var(--muted))" : "hsl(var(--primary))",
          color:
            all.length === 0
              ? "hsl(var(--muted-foreground))"
              : "hsl(var(--primary-foreground))",
          cursor: all.length === 0 ? "not-allowed" : "pointer",
          boxShadow:
            all.length === 0 ? "none" : "0 8px 22px hsl(var(--primary) / 0.3)",
        }}
      >
        Save {all.length} to Tasks
      </Button>
    </>
  }
/>
```

Add `import { ViewHeader } from "@/components/ViewHeader";`. The buttons' inner code is unchanged (Task 5 slims them).

- [ ] **Step 3: Adopt in tasks.view.tsx**

Replace the header block (outer `justify-between` div containing StepLabel, h1 "Tasks", the `<p>` with the History link, and the "New capture" Button) with:

```tsx
<ViewHeader
  eyebrow={<StepLabel step={3} label="Tasks" />}
  title="Tasks"
  description={
    <>
      {rows.length} of {savedCount} open items · completed work moves to{" "}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          navigate("/history");
        }}
      >
        History
      </a>
    </>
  }
  actions={
    <Button
      onClick={() => navigate("/capture")}
      className="h-10 flex-none rounded-[13px] px-[18px] text-[13.5px] font-semibold"
      style={{ boxShadow: "0 8px 22px hsl(var(--primary) / 0.3)" }}
    >
      New capture
    </Button>
  }
/>
```

Add the ViewHeader import. (The old `<p>` had no `max-w`/`leading` — the unified style is an approved normalization.)

- [ ] **Step 4: Adopt in history.view.tsx**

Replace the header block (outer `justify-between` div containing h1 "History", the description `<p>`, and the owner `<Select>`) with:

```tsx
<ViewHeader
  title="History"
  description="Completed action items, newest first. Nothing is deleted — reopen anything that comes back."
  actions={
    <Select value={historyOwner} onValueChange={setHistoryOwner}>
      <SelectTrigger className="min-w-[164px] flex-none rounded-[12px] border-border bg-card px-[13px] text-[13px] text-foreground data-[size=default]:h-[38px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All">All owners</SelectItem>
        {OWNERS.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  }
/>
```

Add the ViewHeader import. (Old `<p>` was `max-w-[64ch]` without `leading-[1.5]`; unifying to 70ch + leading is approved. No eyebrow → h1 gets no top margin, matching today.)

- [ ] **Step 5: Adopt in capture.view.tsx**

Replace the three header elements (the `<StepLabel step={1} …/>`, the `<h1>`, and the `<p … mb-4 …>`) with:

```tsx
<ViewHeader
  eyebrow={<StepLabel step={1} label="Capture" />}
  title="Paste your meeting notes"
  description="Raw notes, a transcript, or a bulleted recap. Names and dates mentioned anywhere in the text become owners and due dates."
/>
```

The old `<p>` carried `mb-4` spacing that ViewHeader does not: add `mt-4` to the next sibling, the card container — change `className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-border bg-card"` to `className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-border bg-card"`. Add the ViewHeader import. (Old `max-w-[64ch]` → 70ch is approved.)

- [ ] **Step 6: Verify**

Run: `pnpm --filter @note2action/web lint && pnpm --filter @note2action/web build`
Expected: both pass with no errors (a pre-existing >500 kB chunk warning in build is fine).

- [ ] **Step 7: Journal + commit**

Append the `memory.md` entry (see Global Constraints), then:

```bash
git add apps/web/src/components/ViewHeader.tsx apps/web/src/views/review/review.view.tsx apps/web/src/views/tasks/tasks.view.tsx apps/web/src/views/history/history.view.tsx apps/web/src/views/capture/capture.view.tsx memory.md
git commit -m "refactor(web): extract ViewHeader component for page headers"
```

---

### Task 2: Progress primitive + StatCard; adopt in History stats

**Files:**

- Create: `apps/web/src/components/ui/progress.tsx`
- Create: `apps/web/src/components/StatCard.tsx`
- Modify: `apps/web/src/views/history/history.utils.ts`
- Modify: `apps/web/src/views/history/history.view.tsx`

**Interfaces:**

- Consumes: `Card` from `@/components/ui/card`; `cn` from `@/lib/utils`; `.n2a-bar` CSS class in `global.css` (animates `width` — the indicator must be width-driven, not translateX).
- Produces: `Progress({ value, className?, indicatorClassName?, indicatorStyle? })`; `StatCard({ label, value, percent, barColor, delta }: { label: string; value: string | number; percent: number; barColor: string; delta: string })`; `StatVM` gains `percent: number` and loses `bar: string`.

- [ ] **Step 1: Create the Progress primitive**

```tsx
// apps/web/src/components/ui/progress.tsx
import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  indicatorClassName,
  indicatorStyle,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
  indicatorStyle?: React.CSSProperties;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className,
      )}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full rounded-full bg-primary", indicatorClassName)}
        style={{ width: `${value ?? 0}%`, ...indicatorStyle }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
```

(Deviation from stock shadcn: the indicator is width-driven and accepts `indicatorClassName`/`indicatorStyle`, so History's `.n2a-bar` width animation and per-stat colors keep working.)

- [ ] **Step 2: Create StatCard**

```tsx
// apps/web/src/components/StatCard.tsx
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatCardProps {
  label: string;
  /** Headline figure, e.g. 12 or "86%". */
  value: string | number;
  /** 0-100 share drawn by the bar. */
  percent: number;
  /** CSS color for the bar, e.g. "hsl(var(--primary))". */
  barColor: string;
  /** Footnote under the bar, e.g. "across 4 meetings". */
  delta: string;
}

/** Compact metric tile: label, big number, thin progress bar, footnote. */
export function StatCard({
  label,
  value,
  percent,
  barColor,
  delta,
}: StatCardProps) {
  return (
    <Card className="gap-0 rounded-[16px] border-0 px-4 py-[13px] shadow-none">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className="mt-[6px] text-[23px] font-bold tracking-[-0.035em] tabular-nums">
        {value}
      </div>
      <Progress
        value={percent}
        className="mt-[9px] h-1 bg-muted"
        indicatorClassName="n2a-bar"
        indicatorStyle={{ background: barColor }}
      />
      <div className="mt-[7px] text-[11px] text-muted-foreground">{delta}</div>
    </Card>
  );
}
```

- [ ] **Step 3: Switch `StatVM.bar` to numeric `percent` in history.utils.ts**

Replace the `StatVM` interface and `historyStats` return with:

```ts
export interface StatVM {
  label: string;
  value: string | number;
  /** 0-100 share drawn by the stat bar. */
  percent: number;
  barColor: string;
  delta: string;
}

export function historyStats(items: ActionItem[]): StatVM[] {
  const done = doneItems(items);
  const open = openItems(items);
  const total = items.length;
  const onTime = done.filter(
    (i) => !i.due || (i.completed || "") <= i.due,
  ).length;
  const donePct = total ? Math.round((done.length / total) * 100) : 0;
  const onTimePct = done.length ? Math.round((onTime / done.length) * 100) : 0;

  return [
    {
      label: "Completed all time",
      value: done.length,
      percent: donePct,
      barColor: "hsl(var(--primary))",
      delta: "across 4 meetings",
    },
    {
      label: "Closed on or before due date",
      value: done.length ? onTimePct + "%" : "—",
      percent: onTimePct,
      barColor: "hsl(var(--primary) / 0.65)",
      delta: onTime + " of " + done.length,
    },
    {
      label: "Still open",
      value: open.length,
      percent: total ? Math.round((open.length / total) * 100) : 0,
      barColor: "hsl(var(--muted-foreground))",
      delta: "in Tasks",
    },
  ];
}
```

(`donePct` was previously a string like `"72%"`; it becomes the number `72`.)

- [ ] **Step 4: Adopt in history.view.tsx**

Replace the stats block — the `stats.map((s) => (...))` inner div with its four children — so the grid wrapper stays and each tile becomes:

```tsx
<div className="my-4 grid flex-none grid-cols-3 gap-3">
  {stats.map((s) => (
    <StatCard key={s.label} {...s} />
  ))}
</div>
```

Add `import { StatCard } from "@/components/StatCard";`. Remove nothing else.

- [ ] **Step 5: Verify**

Run: `pnpm --filter @note2action/web lint && pnpm --filter @note2action/web build`
Expected: both pass.

- [ ] **Step 6: Journal + commit**

Append the `memory.md` entry, then:

```bash
git add apps/web/src/components/ui/progress.tsx apps/web/src/components/StatCard.tsx apps/web/src/views/history/history.utils.ts apps/web/src/views/history/history.view.tsx memory.md
git commit -m "feat(web): add Progress primitive; rebuild History stats on StatCard"
```

---

### Task 3: PriorityBadge on Badge; adopt in TaskRow

**Files:**

- Create: `apps/web/src/components/PriorityBadge.tsx`
- Modify: `apps/web/src/views/tasks/task-row.tsx`
- Modify: `apps/web/src/views/tasks/tasks.utils.ts`

**Interfaces:**

- Consumes: `Badge` from `@/components/ui/badge` (cva component; `className` merges via tailwind-merge, so passed classes beat variant classes); `Priority` type from `@/store/actionItems.types`; `cn` from `@/lib/utils`.
- Produces: `PriorityBadge({ priority, className? }: { priority: Priority; className?: string })`. `PRIORITY_STYLE` is deleted from `tasks.utils.ts` (task-row is its only consumer; verify with a grep before deleting).

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/PriorityBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Priority } from "@/store/actionItems.types";

// Theme-aware pill colors (see --pill-* / --magenta in global.css):
// dark & saturated on light backgrounds, pastel on dark ones.
const PRIORITY_CLASSES: Record<Priority, string> = {
  High: "bg-[hsl(var(--magenta)/0.16)] text-[hsl(var(--pill-magenta))]",
  Medium: "bg-[hsl(var(--primary)/0.22)] text-[hsl(var(--pill-blue))]",
  Low: "bg-[hsl(var(--foreground)/0.07)] text-[hsl(var(--muted-foreground))]",
};

/** Colored pill naming an item's priority. */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <Badge
      variant="ghost"
      className={cn(
        "rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold",
        PRIORITY_CLASSES[priority],
        className,
      )}
    >
      {priority}
    </Badge>
  );
}
```

- [ ] **Step 2: Adopt in task-row.tsx**

Replace this block:

```tsx
<span
  className="inline-flex justify-self-start rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold"
  style={{ background: pr.bg, color: pr.fg }}
>
  {row.priority}
</span>
```

with:

```tsx
<PriorityBadge priority={row.priority} className="justify-self-start" />
```

Then delete the `const pr = PRIORITY_STYLE[row.priority];` line, remove `PRIORITY_STYLE` from the `./tasks.utils` import (keep `STATUS_STYLE`), and add `import { PriorityBadge } from "@/components/PriorityBadge";`.

- [ ] **Step 3: Delete PRIORITY_STYLE from tasks.utils.ts**

First run `grep -rn "PRIORITY_STYLE" apps/web/src` — expected: no remaining references. Then delete the `PRIORITY_STYLE` constant (the `Record<Priority, { bg: string; fg: string }>` block) from `tasks.utils.ts`. If `Priority` is then unused in that file's imports, remove it from the import too.

- [ ] **Step 4: Verify**

Run: `pnpm --filter @note2action/web lint && pnpm --filter @note2action/web build`
Expected: both pass.

- [ ] **Step 5: Journal + commit**

Append the `memory.md` entry, then:

```bash
git add apps/web/src/components/PriorityBadge.tsx apps/web/src/views/tasks/task-row.tsx apps/web/src/views/tasks/tasks.utils.ts memory.md
git commit -m "refactor(web): replace priority pill with Badge-based PriorityBadge"
```

---

### Task 4: ConfidencePill on Badge; adopt in ReviewCard

**Files:**

- Create: `apps/web/src/components/ConfidencePill.tsx`
- Modify: `apps/web/src/views/review/review-card.tsx`
- Modify: `apps/web/src/views/review/review.utils.ts`

**Interfaces:**

- Consumes: `Badge` from `@/components/ui/badge`.
- Produces: `ConfidencePill({ pct, low }: { pct: string; low: boolean })`. `reviewStyle()` in `review.utils.ts` loses its pill keys (`label`, `pillBg`, `pillFg`, `pillBorder`, `dot`) and keeps `cardBorder`, `cardShadow`, `hoverShadow`, `hoverBorder`, `noteFg`.

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/ConfidencePill.tsx
import { Badge } from "@/components/ui/badge";

interface ConfidencePillProps {
  /** Confidence as display text, e.g. "86%". */
  pct: string;
  /** Low-confidence items get the blue "needs review" treatment. */
  low: boolean;
}

/** Dot + percentage + verdict pill shown on Review cards. */
export function ConfidencePill({ pct, low }: ConfidencePillProps) {
  const fg = low ? "text-[hsl(var(--pill-blue))]" : "text-muted-foreground";
  return (
    <Badge
      variant="ghost"
      className={`flex-none gap-[7px] rounded-full px-[10px] py-1 ${
        low
          ? "border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.14)]"
          : "border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--foreground)/0.06)]"
      }`}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-primary" />
      <span className={`text-[11.5px] font-semibold tabular-nums ${fg}`}>
        {pct}
      </span>
      <span className={`text-[11.5px] font-medium ${fg}`}>
        {low ? "needs review" : "confident"}
      </span>
    </Badge>
  );
}
```

(Badge's base classes already provide `border` + `rounded-full` + `inline-flex items-center`; the `border-[…]` classes recolor that border, replacing the old inline `border: 1px solid …`.)

- [ ] **Step 2: Adopt in review-card.tsx**

Replace the pill block — the outer `<span className="flex flex-none items-center gap-[7px] rounded-full px-[10px] py-1 whitespace-nowrap" style={{…}}>` through its closing `</span>` (contains the dot span, the pct span, and the label span) — with:

```tsx
<ConfidencePill pct={item.pct} low={item.low} />
```

Add `import { ConfidencePill } from "@/components/ConfidencePill";`.

- [ ] **Step 3: Slim reviewStyle in review.utils.ts**

Replace the `reviewStyle` function with:

```ts
/** Card styling for a review item, keyed on whether it's low-confidence. */
export function reviewStyle(low: boolean) {
  return {
    cardBorder: low ? "hsl(var(--primary) / 0.45)" : "hsl(var(--border))",
    cardShadow: low ? "0 10px 30px hsl(var(--primary) / 0.16)" : "none",
    hoverShadow: low
      ? "0 16px 38px hsl(var(--primary) / 0.26)"
      : "0 12px 30px hsl(0 0% 0% / 0.35)",
    hoverBorder: low
      ? "hsl(var(--primary) / 0.65)"
      : "hsl(var(--foreground) / 0.18)",
    noteFg: low ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
  };
}
```

First run `grep -rn "pillBg\|pillFg\|pillBorder\|st\.label\|st\.dot" apps/web/src` — expected: no consumers outside the block Step 2 already removed.

- [ ] **Step 4: Verify**

Run: `pnpm --filter @note2action/web lint && pnpm --filter @note2action/web build`
Expected: both pass.

- [ ] **Step 5: Journal + commit**

Append the `memory.md` entry, then:

```bash
git add apps/web/src/components/ConfidencePill.tsx apps/web/src/views/review/review-card.tsx apps/web/src/views/review/review.utils.ts memory.md
git commit -m "refactor(web): replace confidence pill with Badge-based ConfidencePill"
```

---

### Task 5: Button `cta` variant; adopt at all four call sites

**Files:**

- Modify: `apps/web/src/components/ui/button.tsx`
- Modify: `apps/web/src/views/tasks/tasks.view.tsx`
- Modify: `apps/web/src/views/home/home.view.tsx`
- Modify: `apps/web/src/views/capture/capture.view.tsx`
- Modify: `apps/web/src/views/review/review.view.tsx`

**Interfaces:**

- Consumes: `buttonVariants` cva config in `ui/button.tsx`. **Ordering trap:** cva emits variant classes before size classes, and tailwind-merge lets the later class win — so height/padding for `cta` must go in a `compoundVariants` entry (emitted last), NOT in the variant string, or the default size's `h-9 px-4` overrides them.
- Produces: `<Button variant="cta">` = primary color, `rounded-[13px]`, glow shadow, `h-10 px-[18px] text-[13.5px] font-semibold`.

- [ ] **Step 1: Add the variant to ui/button.tsx**

In `buttonVariants`, add to `variants.variant` (after `link`):

```ts
        cta: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-[13px] font-semibold shadow-[0_8px_22px_hsl(var(--primary)/0.3)]",
```

and add a `compoundVariants` key to the cva config object (sibling of `variants` / `defaultVariants`):

```ts
    compoundVariants: [
      {
        variant: "cta",
        size: "default",
        class: "h-10 px-[18px] text-[13.5px]",
      },
    ],
```

- [ ] **Step 2: Adopt in tasks.view.tsx**

Replace the "New capture" button (inside the ViewHeader `actions` after Task 1) with:

```tsx
<Button
  variant="cta"
  onClick={() => navigate("/capture")}
  className="flex-none"
>
  New capture
</Button>
```

- [ ] **Step 3: Adopt in home.view.tsx**

Replace the "New capture" button with:

```tsx
<Button
  variant="cta"
  onClick={() => navigate("/capture")}
  className="mt-6 w-fit"
>
  New capture
</Button>
```

- [ ] **Step 4: Adopt in capture.view.tsx**

Replace the Extract button with:

```tsx
<Button
  variant="cta"
  onClick={onExtract}
  disabled={!canExtract}
  className="disabled:pointer-events-auto disabled:opacity-100"
  style={{
    ...(ready
      ? {}
      : {
          background: "hsl(var(--muted))",
          color: "hsl(var(--muted-foreground))",
          boxShadow: "none",
        }),
    cursor: canExtract ? "pointer" : busy ? "wait" : "not-allowed",
    opacity: busy ? 0.85 : 1,
  }}
>
  {busy ? "Extracting…" : "Extract action items"}
</Button>
```

(The ready-state look comes from the variant; inline style keeps only the not-ready/busy overrides. `px-5` → variant's `px-[18px]` is an approved normalization.)

- [ ] **Step 5: Adopt in review.view.tsx**

Replace the "Save … to Tasks" button (inside ViewHeader `actions` after Task 1) with:

```tsx
<Button
  variant="cta"
  onClick={() => {
    saveToTasks();
    navigate("/tasks");
  }}
  disabled={all.length === 0}
  className="disabled:pointer-events-auto disabled:opacity-100"
  style={
    all.length === 0
      ? {
          background: "hsl(var(--muted))",
          color: "hsl(var(--muted-foreground))",
          boxShadow: "none",
          cursor: "not-allowed",
        }
      : undefined
  }
>
  Save {all.length} to Tasks
</Button>
```

- [ ] **Step 6: Verify**

Run: `pnpm --filter @note2action/web lint && pnpm --filter @note2action/web build`
Expected: both pass.

- [ ] **Step 7: Journal + commit**

Append the `memory.md` entry, then:

```bash
git add apps/web/src/components/ui/button.tsx apps/web/src/views/tasks/tasks.view.tsx apps/web/src/views/home/home.view.tsx apps/web/src/views/capture/capture.view.tsx apps/web/src/views/review/review.view.tsx memory.md
git commit -m "feat(web): add Button cta variant for glowing primary actions"
```
