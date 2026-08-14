# Project Memory — Change Journal

**What this file is:** a running diary of every change an AI agent (Claude Code)
makes to this repository. Each entry explains, in plain language, WHAT changed,
WHICH files were touched, and WHY — written for someone new to programming.
Every technical term is defined the first time it appears in an entry.

**How it stays up to date:** this repo has "hooks" configured in
`.claude/settings.json` (a *hook* is a small script that Claude Code runs
automatically at certain moments). One hook notices when the agent edits any
file; another hook refuses to let the agent finish its turn until it has
written an entry here. So the agent physically cannot forget to update this
file.

**Reading order:** new entries are added at the bottom, so read top-to-bottom
for oldest-to-newest.

---

## 2026-08-14 — Created this journal and the automatic update system

**What changed:** three files were created or edited to set up this journal.

**Files touched:**
- `memory.md` (this file) — created.
- `.claude/settings.json` — created. This is a *configuration file* (a file
  that stores settings, not program code) that Claude Code reads on startup.
  It now contains two hooks, described below.
- `.gitignore` — one line added. `.gitignore` is a list of files that *git*
  (the version-control tool that tracks the history of this project) should
  pretend do not exist, so temporary junk never gets saved into the project
  history.

**Why:** the project owner asked for `memory.md` to be updated automatically,
with a student-friendly explanation, every time an AI agent changes something.

**How the system works, step by step:**
1. When the agent edits or writes any file, a **PostToolUse hook** fires.
   ("PostToolUse" just means "runs right after the agent uses a tool" — here,
   the file-editing tools.) It creates an empty marker file at
   `.claude/.memory_pending`. This is called a *flag file*: its only job is to
   exist or not exist, like a raised flag meaning "changes happened."
2. When the agent tries to finish its turn, a **Stop hook** fires. It checks
   whether the flag file exists. If it does, the hook deletes the flag and
   *blocks* the agent — sending it back with instructions to append a
   beginner-friendly entry to this file first.
3. Edits to `memory.md` itself deliberately do NOT raise the flag. Without
   that exception, writing a journal entry would raise the flag again, the
   Stop hook would block again, and the agent would loop forever.
4. The hooks are written in *shell* (the command language of the terminal) and
   use a helper program called `jq`, which reads *JSON* — a standard text
   format for structured data, made of `{"name": "value"}` pairs — because
   Claude Code hands hooks their information as JSON.

---

## 2026-08-14 — Adopted shadcn/ui components in the web app

**Plain-language summary:** the web app (`apps/web`, the part of the project
that runs in a web browser) used to build its buttons, dropdowns, text boxes,
and pop-up window "by hand" — every one was a raw HTML tag with its own styling.
We replaced those hand-built controls with **shadcn/ui** components. *shadcn/ui*
is not an installed library you import from; it is a collection of ready-made
*React components* (a *component* is a reusable piece of user interface, like a
button, written once and reused everywhere) whose source code you **copy into
your own project** and then own and edit. The big win is consistency: keyboard
navigation, focus rings, and accessibility come built-in, and every control
behaves the same way.

**The key idea that made this safe:** the app's colors and sizes are defined as
**CSS design tokens** (named values like "the primary blue" stored once in a
stylesheet, so the whole app changes if you change the one value) in
`apps/web/src/global.css`. It turned out these token names already matched
exactly what shadcn components expect. So the new components automatically wore
the app's existing grey-and-indigo look **without changing a single color** — we
only had to nudge a few sizes with extra styling classes.

**What changed, file by file:**

*Setup (new plumbing, no visual change):*
- `apps/web/components.json` — created. A settings file that tells the shadcn
  command-line tool where this project keeps its components and stylesheet.
- `apps/web/src/lib/utils.ts` — created. Holds one small helper, `cn()`, that
  merges lists of styling class names together and resolves conflicts (if two
  classes both set the height, the last one wins).
- `apps/web/src/components/ui/*.tsx` — created (button, card, dialog, input,
  textarea, label, select, separator, badge). These are the copied-in shadcn
  component source files. *Dialog* = a pop-up window; *badge* = a small pill
  showing a count or label; *separator* = a thin divider line.
- `apps/web/src/global.css` — one line added: `@import "tw-animate-css";`. This
  pulls in the open/close *animations* (smooth motion effects) that the pop-up
  window and dropdowns use. No colors were touched.
- `apps/web/package.json` + `pnpm-lock.yaml` — recorded the new helper packages
  the components need (for class merging, icons, and the Radix *primitives* —
  low-level unstyled building blocks the components are built on). We also
  removed some duplicate packages we didn't end up needing.

*The five "views" (each view = one full screen/tab of the app):*
- `apps/web/src/views/History/history.view.tsx` — the owner filter dropdown
  became a `Select`; the "Reopen" button became a `Button`. (This was the
  first, smallest screen we converted, to prove the approach before doing the
  rest.)
- `apps/web/src/views/Review/review.view.tsx` — owner/priority dropdowns →
  `Select`, the due-date box → `Input`, the editable title box → `Textarea`,
  and all the buttons → `Button`.
- `apps/web/src/views/Tasks/tasks.view.tsx` — the filter dropdowns and the
  per-row status dropdown → `Select`; the buttons → `Button`; and a
  hand-drawn arrow icon was swapped for a ready-made "undo" icon from the
  `lucide-react` icon set. The status dropdown keeps its color that changes with
  the status (blue for "in progress", etc.).
- `apps/web/src/views/Capture/capture.view.tsx` — the meeting-title box →
  `Input`, the big notes box → `Textarea`, and the two buttons → `Button`.
- `apps/web/src/views/Home/home.view.tsx` — the "New capture" button → `Button`.

*Shared pieces used on every screen:*
- `apps/web/src/components/Sidebar.tsx` — the little number showing how many
  items need review became a `Badge`; the light/dark theme switch buttons became
  `Button`s.
- `apps/web/src/components/RecentModal.tsx` — the pop-up that previews a past
  transcript was rebuilt on the shadcn `Dialog`, which adds proper behavior for
  free: pressing Escape or clicking outside closes it, and keyboard focus is
  trapped inside while it's open.
- `apps/web/src/components/ui/dialog.tsx` — adjusted the pop-up's dimmed
  background to match the app's original slightly-darker, blurred look.

**What we deliberately kept hand-built:** a few things have no shadcn
equivalent, so we left them as custom code — the animated "slot machine"
percentage counter, the celebratory pop/burst effect when a task is completed,
the "loading dots", the small colored dot showing whether the server is online,
and the large clickable summary cards on the Home and Capture screens. The
left-hand navigation links also stay as-is because they are tied to the app's
*router* (the system that swaps screens when you click a tab).

**Why:** the project owner asked to follow shadcn/ui best practices — use a
ready-made component whenever one exists, and only write custom UI when it
doesn't. This makes the app more consistent, more accessible, and easier to
extend later.

**How we checked nothing broke:** after each screen we ran the *type checker*
(`tsc`, a tool that catches mismatched code before it runs) and a *build* (`vite
build`, which compiles the app the way it would ship to real users). Both passed
every time, and all five screens loaded successfully. Each screen was saved as
its own *commit* (a labeled snapshot in git's history) so the changes are easy
to review one at a time. The work lives on a *branch* (a separate line of
history) called `refactor/web-restructure` and has not yet been pushed to the
shared server.

---

## 2026-08-14 — Moved the data-fetching setup into its own providers file

**Plain-language summary:** the web app's start-up file was doing two jobs at
once — starting the app *and* setting up a tool called TanStack Query. We split
the TanStack Query setup out into its own small file so each file has one clear
job.

**Background terms:**
- *TanStack Query* — a library (reusable code written by someone else) that
  fetches data from a server and remembers ("caches") the results so the app
  doesn't re-download the same thing repeatedly.
- *Provider* — in React (the framework this app is built with), a *provider* is
  a wrapper component placed near the top of the app that makes some capability
  available to every component inside it. TanStack Query needs its
  `QueryClientProvider` wrapped around the app so any screen can fetch data.
- *QueryClient* — the object that holds TanStack Query's cache and settings.
  There should be exactly one, shared by the whole app.

**What changed:**
- `apps/web/src/providers.tsx` — **created.** It builds the single `QueryClient`
  and exports a component called `AppProviders` that wraps whatever you put
  inside it with `QueryClientProvider`. This is now the one place to add any
  future app-wide providers (for example a theme or error-handling wrapper).
- `apps/web/src/main.tsx` — **edited.** `main.tsx` is the app's *entry point*
  (the very first file that runs in the browser). It used to create the
  `QueryClient` and write out the provider itself; now it simply wraps the app
  in `<AppProviders>`, so it only worries about starting the app.

**Why the file ends in `.tsx`, not `.ts`:** the user asked for `providers.ts`,
but the file contains *JSX* — the HTML-like syntax React uses to describe user
interface, e.g. `<QueryClientProvider>`. TypeScript (the typed version of
JavaScript this project uses) only allows JSX inside files ending in `.tsx`, so
the file must be named `providers.tsx`.

**Why:** keeping start-up code and provider setup in separate files makes each
easier to read and gives one obvious home for adding more providers later,
without cluttering the entry point.

**How we checked nothing broke:** ran the type checker (`tsc`) and a build
(`vite build`); both passed. This change is not yet committed.

---

## 2026-08-14 — Grouped date helpers, lowercased view folders, added a Step label

Three related tidy-up changes to the web app (`apps/web`), all in one batch.

**1. Put all the date helpers in one file.**
A *helper* (or *utility*) is a small reusable function — a named piece of code
you can call from many places. The date helpers were scattered: one lived in a
general file, two were hidden *privately* inside single screens (*private* means
only that one file could use it), and one was written *inline* (typed directly
where it was used instead of given a name).
- `apps/web/src/lib/dates.ts` — **created.** Now holds four date helpers:
  `formatDate` (turns `"2026-08-14"` into `"Aug 14"`), `todayISO` (gives today's
  date as text like `"2026-08-14"` — *ISO* is the international standard
  year-month-day format), `weekOf` (finds the Monday that starts a given week),
  and `compareDueAsc` (a *comparator* — a function that tells a sort which of two
  dates comes first).
- `apps/web/src/lib/items.ts` — **edited.** `formatDate` was removed from here
  (it moved to `dates.ts`); this file keeps the helpers that pick and count
  to-do items.
- `apps/web/src/views/tasks/tasks.utils.ts` and
  `apps/web/src/views/history/history.utils.ts` — **edited.** Deleted their
  private date helpers and now import the shared ones from `dates.ts`.
- `apps/web/src/views/capture/capture.view.tsx` — **edited.** Replaced the
  inline "today" expression with a call to `todayISO()`.
Why: keeping one kind of helper together makes each easy to find, reuse, and
test, and removes duplicated code.

**2. Made the view folder names lowercase.**
A *view* is one full screen/tab of the app; each lives in its own *folder* (a
named container for files). The folders were capitalized (`Capture`, `Home`,
`Review`, `Tasks`, `History`) while the rest of the project uses lowercase, so
they were renamed to `capture`, `home`, `review`, `tasks`, `history`. The files
inside were already lowercase and did not change names.
- All five folders under `apps/web/src/views/` — **renamed.**
- `apps/web/src/App.tsx` — **edited.** This file lists which screen shows at
  each web address (*routing*); its references were updated to the new
  lowercase folder names. This matters because although Mac ignores
  upper/lowercase in file names, the build servers that ship the app do not, so
  the names must match exactly.
Why: consistent naming across the project avoids confusion and prevents
hard-to-spot bugs on case-sensitive systems.

**3. Turned the "STEP 1 OF 3" label into a reusable component and added Step 3.**
A *component* is a reusable piece of interface. The small "STEP 1 OF 3 —
CAPTURE" label above each screen's title was copy-pasted in two screens, so it
was extracted into one component you configure with a step number and a name.
- `apps/web/src/components/StepLabel.tsx` — **created.** Renders text like
  "STEP 2 OF 3 — REVIEW" from the `step` number and `label` you give it.
- `apps/web/src/views/capture/capture.view.tsx` and
  `apps/web/src/views/review/review.view.tsx` — **edited.** Replaced their
  hand-written label with `<StepLabel step={1} label="Capture" />` and
  `<StepLabel step={2} label="Review" />`.
- `apps/web/src/views/tasks/tasks.view.tsx` — **edited.** Added a new
  `<StepLabel step={3} label="Tasks" />`, so the three-step flow
  Capture → Review → Tasks now shows its final step.
Why: one component means the label looks and behaves the same everywhere, and a
change only has to be made once.

**How we checked nothing broke:** ran the type checker (`tsc`) and the build
(`vite build`) — both passed — and loaded all five screens successfully. Not yet
committed.

---

## 2026-08-14 — Split big screens into smaller components; removed two copy-pasted patterns

Four related tidy-up changes to the web app (`apps/web`), continuing the
restructure. A *component* is a named, reusable piece of user interface; the
theme of this batch is moving big blocks of interface out of crowded files and
into their own small, well-named components.

**1. Moved the Review card into its own file.**
The Review screen shows a grid of editable cards (one per extracted action
item). The card's code — about 130 lines — lived at the bottom of the same file
as the screen itself, making that file 263 lines long and hard to scan.
- `apps/web/src/views/review/review-card.tsx` — **created.** Holds the
  `ReviewCard` component, moved over unchanged.
- `apps/web/src/views/review/review.view.tsx` — **edited.** Now imports
  `ReviewCard` instead of defining it; shrank from 263 to 119 lines, and its
  import list dropped the pieces only the card needed.

**2. Turned the Tasks row into a `TaskRow` component.**
The Tasks screen rendered each row with a 70-line *function* written inside the
screen (a function is a named block of code; this one built the row's interface
each time it was called).
- `apps/web/src/views/tasks/task-row.tsx` — **created.** Holds the new
  `TaskRow` component plus the column-width definition (`COLS`) that only rows
  use. The row reads the "send back to Review" action from the shared store
  itself; the screen passes in only what it alone knows — whether this row is
  playing its "completed" animation, and what to do when the status changes.
- `apps/web/src/views/tasks/tasks.view.tsx` — **edited.** Uses `<TaskRow>` and
  shrank from 227 to about 160 lines.

**3. One shared section heading — and a small bug fixed by it.**
Tasks and History both draw the same "LABEL ───── count" heading above each
group of rows, and the code was copy-pasted. The copies had already *drifted*
(become subtly different): History's divider line was hard-coded to
semi-transparent **white** (`bg-white/[0.14]`), which is invisible-to-wrong on
the light theme, while Tasks correctly used the theme's border color.
- `apps/web/src/components/SectionHeading.tsx` — **created.** Takes a `label`
  and a `count` (a bare number like `3`, or ready-made text like `"3 items"`).
- `apps/web/src/views/tasks/tasks.view.tsx` and
  `apps/web/src/views/history/history.view.tsx` — **edited.** Both now use
  `<SectionHeading>`; History's divider now follows the theme, fixing the
  light-mode drift.

**4. One shared "nothing here yet" card.**
Review (twice) and History each hand-built the same dashed-border placeholder
card shown when a list is empty.
- `apps/web/src/components/EmptyState.tsx` — **created.** Shows a bold title
  plus muted description, or a single muted line if no title is given.
- `review.view.tsx` and `history.view.tsx` — **edited** to use it. History's
  card had slightly different padding than Review's (60px tall vs 52px, and a
  hair narrower); it now matches Review exactly — a deliberate, barely visible
  normalization so all empty states look identical.

**Why:** smaller files are easier to read; shared components mean a change is
made once and every screen picks it up — and the drifted divider color shows
exactly what goes wrong when the same code is maintained in two places.

**How we checked nothing broke:** ran the type checker (`tsc`) — it caught one
mistake mid-work (the heading's `count` was first typed as number-only, but
History passes text like "3 items"; the type was widened to accept both) — and
the production build (`vite build`); both pass. Not yet committed.

---

## 2026-08-14 — Saved a personal working rule outside the repository

**What changed:** no project code was touched. The AI assistant wrote two small
notes to its own private *memory folder* — a directory on this computer at
`~/.claude/projects/-Users-macbook-note2action/memory/`, outside this
repository (so git does not track it) — recording the project owner's
instruction: **never run `git commit` (or push) without asking first.**

**Files touched (both outside the repo):**
- `.../memory/ask-before-committing.md` — created. Holds the rule itself, why
  it exists, and how to apply it in future sessions.
- `.../memory/MEMORY.md` — created. An *index* (a table of contents) listing
  each saved note so future sessions can find them.

**Why:** earlier today the assistant committed two refactor steps on its own,
following the branch's apparent one-commit-per-step habit. The owner asked
that committing always be confirmed first. Writing the rule to the persistent
memory folder means every future session starts already knowing it, instead of
relearning it by making the same mistake.

---

## 2026-08-14 — Extracted ViewHeader component for page headers

**Plain-language summary:** the web app has five different screens (Capture,
Review, Tasks, History, Home). Each screen shows a header at the top with a
title, sometimes an eyebrow label (like "STEP 1 OF 3"), sometimes a description,
and sometimes action buttons. The code for arranging these pieces was
copy-pasted in each screen. Today we extracted that repeated pattern into one
reusable *component* (a building block of interface). Now every screen's header
uses the same component, making them consistent and easier to maintain.

**Background:** when you copy code from one file to five files, the copies stay
synchronized only if you remember to edit all five when something changes. A
*component* centralizes the code — change it once and all five screens pick up
the change automatically.

**What changed:**

- `apps/web/src/components/ViewHeader.tsx` — **created.** Exports a new
  `ViewHeader` component that takes four optional pieces: `eyebrow` (small text
  above the title, e.g. "STEP 1 OF 3"), `title` (the main heading), `description`
  (muted text below the title), and `actions` (buttons or other controls aligned
  to the right). The component arranges them in a consistent layout with
  spacing and typography rules baked in.

- `apps/web/src/views/review/review.view.tsx` — **edited.** Replaced the old
  hand-built header (a `<div>` containing `StepLabel`, `<h1>`, `<p>`, and two
  buttons) with `<ViewHeader eyebrow={…} title={…} description={…} actions={…}
  />`. Added the import for the new component.

- `apps/web/src/views/tasks/tasks.view.tsx` — **edited.** Same pattern: old
  header replaced with `<ViewHeader>`. The description now contains a link to
  History (moved from the old `<p>` inside the component). Added import.

- `apps/web/src/views/history/history.view.tsx` — **edited.** History had no
  eyebrow (no step label), so `<ViewHeader title={…} description={…}
  actions={…} />` omits the `eyebrow`. The `actions` slot holds the owner filter
  `<Select>`. Added import.

- `apps/web/src/views/capture/capture.view.tsx` — **edited.** Replaced the
  three old elements (`StepLabel`, `<h1>`, `<p>`) with `<ViewHeader eyebrow={…}
  title={…} description={…} />` (no actions on this screen). Also added `mt-4`
  (margin-top) to the card container below, since the old `<p>` had bottom margin
  that ViewHeader does not — the margin moves to the next element to keep spacing
  the same.

**Typography and spacing rules baked into ViewHeader:**
- Title is 25px, bold, with tight line height (1.12) and slight letter-spacing
  tightening. It gets 7px top-margin only if there is an eyebrow above it.
- Description is always 13px, muted grey, with a 70-character max-width for
  readability and line height 1.5 for breathing room. 7px top-margin.
- Actions are right-aligned, flex display with 10px gap between buttons.
- The eyebrow, title, and description are grouped on the left; actions on the
  right, with 10px gap between the two groups.

**Normalizations (small improvements made while unifying):**
- Description max-width went from 64ch (64 characters) to 70ch in History and
  Capture, for visual consistency across the app. This is more readable.

**Why:** unifying all five headers into one component makes them easier to
maintain and ensures they all look and behave identically. If a design tweak is
needed later, it happens in one place.

**How we checked nothing broke:** ran the type checker (`tsc --noEmit`) and
production build (`vite build`) — both passed. A pre-existing >500 kB chunk size
warning from Vite is expected and approved. All five screens loaded successfully
in manual testing (not committed yet).

---

## 2026-08-14 — Deleted two leftover design-mockup files from the web app

**What changed:** two files were deleted. No code was added or edited; the app
itself behaves exactly the same.

**Files touched (both deleted):**
- `apps/web/src/index.html`
- `apps/web/src/support.js`

**Why they existed:** they were leftovers from a design-mockup tool (a program
that draws quick visual previews of screens before they are really built). The
mockup tool had dropped its own preview page and a generated *script* (a file
of JavaScript code) into the `src` folder, where the app's real source code
lives. Neither file was ever used by the app.

**Why deleting them matters:** the real `index.html` — the single starting page
a browser loads first, which every web app must have exactly one of — lives one
folder up, at `apps/web/index.html`. That is where *Vite* (the tool that builds
and serves this app during development) expects to find it. Having a second,
unrelated `index.html` inside `src/` is confusing: a reader could easily open
the wrong one and wonder why edits do nothing. Neither file was tracked by
*git* (the version-control tool that records the project's history), meaning
git had never saved them, so deleting them loses nothing and touches no
history.

**How we checked it was safe:** before deleting, the files' contents were read.
Both contained generated mockup-runtime code (the first line of `support.js`
even says "GENERATED … do not edit"), and a search of the app's real code found
nothing that references them. Deleting a file nothing points to cannot break
the app.

---

## 2026-08-14 — Created Progress primitive and StatCard component; rebuilt History stats

**Plain-language summary:** the History screen displays three small metric tiles
("Completed all time", "Closed on or before due date", "Still open"). Each tile
showed the same structure: a label, a big number, a thin progress bar, and a
footnote. That repeated structure was hand-written directly in the screen file.
Today we extracted it into a reusable *component* called `StatCard`. Under the
hood, `StatCard` uses a new `Progress` *primitive* — a low-level building block
from the Radix UI library that draws a thin bar. This lets the History stats be
cleaner and more maintainable.

**Background terms:**
- *Primitive* — a very basic, unstyled UI building block from Radix UI (a library
  that provides low-level interactive components). Primitives are wrapped and
  styled by higher-level components to get the look and behavior you want.
- *Progress bar* — a thin colored stripe that grows or shrinks to show how much
  of something is done (e.g. 72% complete).
- *Radix UI* — a library providing unstyled primitives for menus, buttons, 
  dialogs, and other common controls that handle keyboard and accessibility for
  you.

**What changed:**

- `apps/web/src/components/ui/progress.tsx` — **created.** Wraps Radix UI's
  `Progress` primitive and styles it with Tailwind. It accepts a `value`
  (the percentage to fill, from 0–100), and optional styling classes for the
  indicator bar. The bar width is set via inline CSS, not a transform, so
  animations that smoothly grow the bar can work correctly.

- `apps/web/src/components/StatCard.tsx` — **created.** A higher-level component
  that shows a complete metric tile: a label (small grey text), a headline number
  or percentage, a thin bar filled to a percentage, and a footnote. It accepts five
  *props* (configuration values): `label`, `value`, `percent` (0–100), `barColor`
  (a CSS color), and `delta` (the footnote text). The visual layout (spacing,
  typography, rounded corners) is baked in.

- `apps/web/src/views/history/history.utils.ts` — **edited.** The `StatVM`
  *interface* (a TypeScript description of the shape of data) changed: the `bar`
  field was removed and replaced with `percent`. Previously `bar` held a string
  like `"72%"` that was then written directly as a CSS `width`. Now `percent` is
  a plain number like `72`, and the `Progress` component applies the `%` unit
  itself. The `historyStats` function was updated to calculate `percent` as a
  number instead of formatting it as a string.

- `apps/web/src/views/history/history.view.tsx` — **edited.** Added an import
  for the new `StatCard` component. Replaced the hand-written `<div>` loop (about
  14 lines of markup that built each tile) with a single line `<StatCard {...s} />`
  that spreads the stat data as props. The outer grid wrapper stayed the same.

**Why:** extracting the tile pattern into `StatCard` shrinks the screen file and
makes the stats easier to tweak (change fonts, spacing, or bar colors in one
place and all three tiles update). The `Progress` primitive handles the technical
details of rendering a bar correctly, while `StatCard` handles the tile layout.

**How we checked nothing broke:** ran the type checker (`tsc --noEmit`) — it
passed — and the production build (`vite build`) — it passed. The pre-existing
>500 kB chunk size warning is expected and approved. Not yet committed.

---

## 2026-08-14 — Converted priority pill to PriorityBadge component on Badge

**Plain-language summary:** the Tasks screen displayed priority (High, Medium,
Low) as a small colored pill next to each task. The styling was defined inline
using HTML *style* attributes (a *style attribute* = colors and sizes written
directly in the tag). Today we converted that hand-styled pill into a reusable
*component* called `PriorityBadge`, built on top of the shadcn `Badge` primitive.
A *component* is a named, reusable piece of interface. shadcn's `Badge` provides
consistent styling, class-merging, and accessibility for free; we only had to add
the priority-specific colors.

**What changed:**

- `apps/web/src/components/PriorityBadge.tsx` — **created.** A new component
  that accepts a `priority` (one of "High", "Medium", "Low") and optional
  `className` for additional styling. It renders a `Badge` with theme-aware
  colors stored in a `PRIORITY_CLASSES` lookup table (a data structure that maps
  each priority name to a color *string* — text like `"bg-[hsl(...)]"` that
  Tailwind converts to CSS). The colors come from CSS *design tokens* (named
  values like `--magenta` defined once in `global.css`, so the whole app changes
  if you edit them).

- `apps/web/src/views/tasks/task-row.tsx` — **edited.** Added an import for the
  new `PriorityBadge`. Removed the old inline `<span>` that used inline *style*
  attributes (HTML attributes that set colors directly, like `style={{ color:
  pr.fg }}`). Replaced it with `<PriorityBadge priority={row.priority}
  className="justify-self-start" />`. Also deleted the line `const pr =
  PRIORITY_STYLE[row.priority];` since `PRIORITY_STYLE` is no longer used.

- `apps/web/src/views/tasks/tasks.utils.ts` — **edited.** Deleted the entire
  `PRIORITY_STYLE` constant (a lookup table mapping priority names to color
  objects). Removed `Priority` from the *import* statement, since it was only
  used to *type* (describe the structure of) `PRIORITY_STYLE`. Kept `STATUS_STYLE`
  (which colors the status dropdown), since Tasks still uses it.

**Why:** a component centralizes styling logic so it is written once, used
everywhere, and easy to change. Using shadcn's `Badge` ensures the pill has
consistent behavior with the rest of the app's badge use. Removing inline styles
and hand-built color lookups makes the Tasks screen cleaner and easier to read.

**How we checked nothing broke:** a *grep* (a search tool) confirmed that
`PRIORITY_STYLE` was only defined once, nowhere else, so it was safe to delete.
Ran the type checker (`tsc --noEmit`) — it passed. Ran the production build
(`vite build`) — it passed. Not yet committed.

---

## 2026-08-14 — Converted confidence pill to ConfidencePill component on Badge

**Plain-language summary:** the Review screen displayed a small pill on each card
showing the confidence level as a percentage and a verdict ("needs review" or
"confident"). The pill was hand-styled with inline colors and built-in logic for
different low/high states. Today we converted that into a reusable *component*
called `ConfidencePill`, built on the shadcn `Badge` primitive. The component
encapsulates the color choices and layout, and also enabled us to slim down the
`reviewStyle` function — it no longer has to know about pill styling at all.

**What changed:**

- `apps/web/src/components/ConfidencePill.tsx` — **created.** A new component
  that accepts `pct` (the confidence percentage as text, e.g. "86%") and `low`
  (a boolean flag, true if this item needs review). It renders a `Badge` with a
  small blue dot, the percentage number in tabular font (monospace digits that
  line up vertically), and a verdict label ("needs review" for low, "confident"
  for high). Colors and borders change based on the `low` flag: low-confidence
  items get blue tones (drawn from `--pill-blue` and `--primary`), while
  high-confidence items get muted greys.

- `apps/web/src/views/review/review-card.tsx` — **edited.** Added an import for
  the new `ConfidencePill`. Removed the entire hand-built pill `<span>` block
  (which contained the dot, percentage, and label, each with inline *style*
  attributes). Replaced it with a single line: `<ConfidencePill pct={item.pct}
  low={item.low} />`.

- `apps/web/src/views/review/review.utils.ts` — **edited.** Removed five keys
  from the `reviewStyle` function's return value: `label`, `pillBg`, `pillFg`,
  `pillBorder`, and `dot`. These were only used by the pill span we just deleted.
  Kept the four remaining keys that style the card itself: `cardBorder`,
  `cardShadow`, `hoverShadow`, `hoverBorder`, plus `noteFg` (the color of the
  note text at the card's bottom). The function is now simpler and does one job:
  styling the card, not the pill.

**Why:** extracting the pill into a component makes Review cleaner — the screen
no longer has 20+ lines of pill markup and styling inline, and the card-styling
function can focus purely on card styling. Using shadcn's `Badge` gives the pill
consistent behavior and accessibility. Removing `label`, `dot`, and the pill
colors from `reviewStyle` makes it easier to understand at a glance: it *only*
styles the card.

**How we checked nothing broke:** a *grep* confirmed that `pillBg`, `pillFg`,
`pillBorder`, `st.label`, and `st.dot` are only defined in `review.utils.ts` and
nowhere else (now that the pill span is gone). Ran the type checker (`tsc
--noEmit`) — it passed. Ran the production build (`vite build`) — it passed. Not
yet committed.

---

## 2026-08-14 — Added Button cta variant for glowing primary actions

**Plain-language summary:** the web app uses four prominent action buttons at
critical moments: "New capture" on Tasks and Home screens, "Extract action
items" on Capture, and "Save to Tasks" on Review. Each was hand-styled with the
same glow shadow and custom sizes. Today we extracted that styling into a
reusable `cta` (*call-to-action*) variant of the shadcn `Button` component,
replacing four separate style definitions with a single, consistent variant.

**Background:** a *variant* in shadcn's `cva` system is a named style option
you apply to a component — like `variant="outline"` or `variant="ghost"` on a
button. Under the hood, `cva` (*class-variance-authority*) generates class
strings based on variant names, and *Tailwind* (the CSS framework) applies those
classes. A subtle ordering detail: `cva` emits classes in this order: defaults,
then variants, then *compound variants* (special combos of two or more variant
settings). Because Tailwind's *merge* tool lets the last class win, sizing
(`h-10`, `px-[18px]`, `text-[13.5px]`) must go in `compoundVariants` to beat the
default size's `h-9 px-4`.

**What changed:**

- `apps/web/src/components/ui/button.tsx` — **edited.** Added a new `cta` entry
  to the button's `variants.variant` list. The cta variant sets the primary
  color, rounded corners (`rounded-[13px]`), semibold weight, and the 8px glow
  shadow. Also added a new `compoundVariants` key (a first-time addition to this
  file) with one entry: when `variant="cta"` *and* `size="default"`, apply
  `h-10 px-[18px] text-[13.5px]` (the custom sizing, emitted last so it wins).

- `apps/web/src/views/tasks/tasks.view.tsx` — **edited.** Replaced the "New
  capture" button's inline classes and shadow style with `variant="cta"`,
  removing 3 redundant lines.

- `apps/web/src/views/home/home.view.tsx` — **edited.** Replaced the "New
  capture" button's inline classes and shadow style with `variant="cta"`,
  removing 3 redundant lines.

- `apps/web/src/views/capture/capture.view.tsx` — **edited.** Replaced the
  "Extract action items" button's inline classes and complex shadow style
  (which changed based on the `ready` state) with `variant="cta"`. The button
  keeps its conditional styling for not-ready/busy states (using `ready ? {} :
  {...}` in the style prop to apply overrides only when not ready), and kept
  the `disabled` and `cursor` logic. Normalized the padding from `px-5` to the
  variant's `px-[18px]`.

- `apps/web/src/views/review/review.view.tsx` — **edited.** Replaced the "Save
  to Tasks" button's inline classes and complex disabled-state styling with
  `variant="cta"`. The button keeps its conditional styling: when `all.length
  === 0`, the style prop applies muted colors and `cursor: "not-allowed"`,
  otherwise `{ cursor: "pointer" }` (the variant's primary colors show, and the
  mouse pointer becomes the pointing hand over the enabled button — matching how
  the button behaved before this change).

*Post-review fix (same day):* code review caught that the enabled Save button
had lost its pointing-hand cursor (the first version passed `undefined` instead
of `{ cursor: "pointer" }` in the enabled branch — a *regression*, meaning
something that used to work stopped working). The enabled branch now restores
`cursor: "pointer"`, and the button block's *indentation* (the leading spaces
that show code nesting) was aligned with its sibling button. The review also
noted the Capture/Review buttons newly gain the variant's hover darkening
(`hover:bg-primary/90`); this was accepted deliberately so all four CTA buttons
behave identically.

**Why:** consolidating four hand-styled buttons into one reusable variant makes
the code shorter, more maintainable, and ensures all CTAs look identical. If the
glow shadow or rounded corners need tweaking in the future, one edit updates all
four buttons — and the centr­al definition in `button.tsx` is easier to audit
for accessibility.

**How we checked nothing broke:** ran the type checker (`tsc --noEmit`) — passed.
Ran the production build (`vite build`) — passed. The pre-existing >500 kB chunk
size warning is expected and approved. All four screens (Tasks, Home, Capture,
Review) loaded successfully with the new variant applied.

---

## 2026-08-14 — Fixed PriorityBadge border for pixel-perfect alignment

**Plain-language summary:** the Priority pills on the Tasks screen were slightly
larger than intended. The shadcn `Badge` component (a reusable styled building
block) adds a 1-pixel *transparent border* (a thin edge that is invisible but
takes up space) to all badges by default. Our `PriorityBadge` component inherited
this border, making the pill about 2 pixels larger in each dimension than the
original hand-built version. We fixed it by adding `border-0` (a Tailwind class
that removes all borders) to disable the inherited border.

**Background:** *Tailwind* is a CSS framework where you apply styles using short
class names like `border-0` instead of writing CSS by hand. A *CSS class* is a
named set of styling rules. When components are *composed* (built from other
components), they inherit styling from their base layer unless explicitly
overridden.

**What changed:**
- `apps/web/src/components/PriorityBadge.tsx` — **edited.** The base class string
  for the Badge's `className` now starts with `border-0`, moving the string from
  `"rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold"` to
  `"border-0 rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold"`.

**Why:** this is a *pixel-parity* fix — ensuring the rebuilt component matches the
original design pixel-for-pixel. The 1px transparent border was invisible but
broke the intended sizing. Removing it makes High/Medium/Low pills render at their
intended dimensions, aligning with the design system's precision.

**How we checked nothing broke:** ran the linter (`pnpm --filter @note2action/web
lint`) — passed, catching no style issues. Ran the production build (`pnpm --filter
@note2action/web build`) — passed. The pre-existing >500 kB chunk size warning is
expected and approved.
