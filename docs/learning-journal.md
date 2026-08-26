# Project Memory — Change Journal

**What this file is:** a running diary of every change an AI agent (Claude Code)
makes to this repository. Each entry explains, in plain language, WHAT changed,
WHICH files were touched, and WHY — written for someone new to programming.
Every technical term is defined the first time it appears in an entry.

**How it stays up to date:** this repo has "hooks" configured in
`.claude/settings.json` (a _hook_ is a small script that Claude Code runs
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
- `.claude/settings.json` — created. This is a _configuration file_ (a file
  that stores settings, not program code) that Claude Code reads on startup.
  It now contains two hooks, described below.
- `.gitignore` — one line added. `.gitignore` is a list of files that _git_
  (the version-control tool that tracks the history of this project) should
  pretend do not exist, so temporary junk never gets saved into the project
  history.

**Why:** the project owner asked for `memory.md` to be updated automatically,
with a student-friendly explanation, every time an AI agent changes something.

**How the system works, step by step:**

1. When the agent edits or writes any file, a **PostToolUse hook** fires.
   ("PostToolUse" just means "runs right after the agent uses a tool" — here,
   the file-editing tools.) It creates an empty marker file at
   `.claude/.memory_pending`. This is called a _flag file_: its only job is to
   exist or not exist, like a raised flag meaning "changes happened."
2. When the agent tries to finish its turn, a **Stop hook** fires. It checks
   whether the flag file exists. If it does, the hook deletes the flag and
   _blocks_ the agent — sending it back with instructions to append a
   beginner-friendly entry to this file first.
3. Edits to `memory.md` itself deliberately do NOT raise the flag. Without
   that exception, writing a journal entry would raise the flag again, the
   Stop hook would block again, and the agent would loop forever.
4. The hooks are written in _shell_ (the command language of the terminal) and
   use a helper program called `jq`, which reads _JSON_ — a standard text
   format for structured data, made of `{"name": "value"}` pairs — because
   Claude Code hands hooks their information as JSON.

---

## 2026-08-14 — Adopted shadcn/ui components in the web app

**Plain-language summary:** the web app (`apps/web`, the part of the project
that runs in a web browser) used to build its buttons, dropdowns, text boxes,
and pop-up window "by hand" — every one was a raw HTML tag with its own styling.
We replaced those hand-built controls with **shadcn/ui** components. _shadcn/ui_
is not an installed library you import from; it is a collection of ready-made
_React components_ (a _component_ is a reusable piece of user interface, like a
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

_Setup (new plumbing, no visual change):_

- `apps/web/components.json` — created. A settings file that tells the shadcn
  command-line tool where this project keeps its components and stylesheet.
- `apps/web/src/lib/utils.ts` — created. Holds one small helper, `cn()`, that
  merges lists of styling class names together and resolves conflicts (if two
  classes both set the height, the last one wins).
- `apps/web/src/components/ui/*.tsx` — created (button, card, dialog, input,
  textarea, label, select, separator, badge). These are the copied-in shadcn
  component source files. _Dialog_ = a pop-up window; _badge_ = a small pill
  showing a count or label; _separator_ = a thin divider line.
- `apps/web/src/global.css` — one line added: `@import "tw-animate-css";`. This
  pulls in the open/close _animations_ (smooth motion effects) that the pop-up
  window and dropdowns use. No colors were touched.
- `apps/web/package.json` + `pnpm-lock.yaml` — recorded the new helper packages
  the components need (for class merging, icons, and the Radix _primitives_ —
  low-level unstyled building blocks the components are built on). We also
  removed some duplicate packages we didn't end up needing.

_The five "views" (each view = one full screen/tab of the app):_

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

_Shared pieces used on every screen:_

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
_router_ (the system that swaps screens when you click a tab).

**Why:** the project owner asked to follow shadcn/ui best practices — use a
ready-made component whenever one exists, and only write custom UI when it
doesn't. This makes the app more consistent, more accessible, and easier to
extend later.

**How we checked nothing broke:** after each screen we ran the _type checker_
(`tsc`, a tool that catches mismatched code before it runs) and a _build_ (`vite
build`, which compiles the app the way it would ship to real users). Both passed
every time, and all five screens loaded successfully. Each screen was saved as
its own _commit_ (a labeled snapshot in git's history) so the changes are easy
to review one at a time. The work lives on a _branch_ (a separate line of
history) called `refactor/web-restructure` and has not yet been pushed to the
shared server.

---

## 2026-08-14 — Moved the data-fetching setup into its own providers file

**Plain-language summary:** the web app's start-up file was doing two jobs at
once — starting the app _and_ setting up a tool called TanStack Query. We split
the TanStack Query setup out into its own small file so each file has one clear
job.

**Background terms:**

- _TanStack Query_ — a library (reusable code written by someone else) that
  fetches data from a server and remembers ("caches") the results so the app
  doesn't re-download the same thing repeatedly.
- _Provider_ — in React (the framework this app is built with), a _provider_ is
  a wrapper component placed near the top of the app that makes some capability
  available to every component inside it. TanStack Query needs its
  `QueryClientProvider` wrapped around the app so any screen can fetch data.
- _QueryClient_ — the object that holds TanStack Query's cache and settings.
  There should be exactly one, shared by the whole app.

**What changed:**

- `apps/web/src/providers.tsx` — **created.** It builds the single `QueryClient`
  and exports a component called `AppProviders` that wraps whatever you put
  inside it with `QueryClientProvider`. This is now the one place to add any
  future app-wide providers (for example a theme or error-handling wrapper).
- `apps/web/src/main.tsx` — **edited.** `main.tsx` is the app's _entry point_
  (the very first file that runs in the browser). It used to create the
  `QueryClient` and write out the provider itself; now it simply wraps the app
  in `<AppProviders>`, so it only worries about starting the app.

**Why the file ends in `.tsx`, not `.ts`:** the user asked for `providers.ts`,
but the file contains _JSX_ — the HTML-like syntax React uses to describe user
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
A _helper_ (or _utility_) is a small reusable function — a named piece of code
you can call from many places. The date helpers were scattered: one lived in a
general file, two were hidden _privately_ inside single screens (_private_ means
only that one file could use it), and one was written _inline_ (typed directly
where it was used instead of given a name).

- `apps/web/src/lib/dates.ts` — **created.** Now holds four date helpers:
  `formatDate` (turns `"2026-08-14"` into `"Aug 14"`), `todayISO` (gives today's
  date as text like `"2026-08-14"` — _ISO_ is the international standard
  year-month-day format), `weekOf` (finds the Monday that starts a given week),
  and `compareDueAsc` (a _comparator_ — a function that tells a sort which of two
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
A _view_ is one full screen/tab of the app; each lives in its own _folder_ (a
named container for files). The folders were capitalized (`Capture`, `Home`,
`Review`, `Tasks`, `History`) while the rest of the project uses lowercase, so
they were renamed to `capture`, `home`, `review`, `tasks`, `history`. The files
inside were already lowercase and did not change names.

- All five folders under `apps/web/src/views/` — **renamed.**
- `apps/web/src/App.tsx` — **edited.** This file lists which screen shows at
  each web address (_routing_); its references were updated to the new
  lowercase folder names. This matters because although Mac ignores
  upper/lowercase in file names, the build servers that ship the app do not, so
  the names must match exactly.
  Why: consistent naming across the project avoids confusion and prevents
  hard-to-spot bugs on case-sensitive systems.

**3. Turned the "STEP 1 OF 3" label into a reusable component and added Step 3.**
A _component_ is a reusable piece of interface. The small "STEP 1 OF 3 —
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
restructure. A _component_ is a named, reusable piece of user interface; the
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
The Tasks screen rendered each row with a 70-line _function_ written inside the
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
group of rows, and the code was copy-pasted. The copies had already _drifted_
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
notes to its own private _memory folder_ — a directory on this computer at
`~/.claude/projects/-Users-macbook-note2action/memory/`, outside this
repository (so git does not track it) — recording the project owner's
instruction: **never run `git commit` (or push) without asking first.**

**Files touched (both outside the repo):**

- `.../memory/ask-before-committing.md` — created. Holds the rule itself, why
  it exists, and how to apply it in future sessions.
- `.../memory/MEMORY.md` — created. An _index_ (a table of contents) listing
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
reusable _component_ (a building block of interface). Now every screen's header
uses the same component, making them consistent and easier to maintain.

**Background:** when you copy code from one file to five files, the copies stay
synchronized only if you remember to edit all five when something changes. A
_component_ centralizes the code — change it once and all five screens pick up
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
mockup tool had dropped its own preview page and a generated _script_ (a file
of JavaScript code) into the `src` folder, where the app's real source code
lives. Neither file was ever used by the app.

**Why deleting them matters:** the real `index.html` — the single starting page
a browser loads first, which every web app must have exactly one of — lives one
folder up, at `apps/web/index.html`. That is where _Vite_ (the tool that builds
and serves this app during development) expects to find it. Having a second,
unrelated `index.html` inside `src/` is confusing: a reader could easily open
the wrong one and wonder why edits do nothing. Neither file was tracked by
_git_ (the version-control tool that records the project's history), meaning
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
Today we extracted it into a reusable _component_ called `StatCard`. Under the
hood, `StatCard` uses a new `Progress` _primitive_ — a low-level building block
from the Radix UI library that draws a thin bar. This lets the History stats be
cleaner and more maintainable.

**Background terms:**

- _Primitive_ — a very basic, unstyled UI building block from Radix UI (a library
  that provides low-level interactive components). Primitives are wrapped and
  styled by higher-level components to get the look and behavior you want.
- _Progress bar_ — a thin colored stripe that grows or shrinks to show how much
  of something is done (e.g. 72% complete).
- _Radix UI_ — a library providing unstyled primitives for menus, buttons,
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
  _props_ (configuration values): `label`, `value`, `percent` (0–100), `barColor`
  (a CSS color), and `delta` (the footnote text). The visual layout (spacing,
  typography, rounded corners) is baked in.

- `apps/web/src/views/history/history.utils.ts` — **edited.** The `StatVM`
  _interface_ (a TypeScript description of the shape of data) changed: the `bar`
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

> 500 kB chunk size warning is expected and approved. Not yet committed.

---

## 2026-08-14 — Converted priority pill to PriorityBadge component on Badge

**Plain-language summary:** the Tasks screen displayed priority (High, Medium,
Low) as a small colored pill next to each task. The styling was defined inline
using HTML _style_ attributes (a _style attribute_ = colors and sizes written
directly in the tag). Today we converted that hand-styled pill into a reusable
_component_ called `PriorityBadge`, built on top of the shadcn `Badge` primitive.
A _component_ is a named, reusable piece of interface. shadcn's `Badge` provides
consistent styling, class-merging, and accessibility for free; we only had to add
the priority-specific colors.

**What changed:**

- `apps/web/src/components/PriorityBadge.tsx` — **created.** A new component
  that accepts a `priority` (one of "High", "Medium", "Low") and optional
  `className` for additional styling. It renders a `Badge` with theme-aware
  colors stored in a `PRIORITY_CLASSES` lookup table (a data structure that maps
  each priority name to a color _string_ — text like `"bg-[hsl(...)]"` that
  Tailwind converts to CSS). The colors come from CSS _design tokens_ (named
  values like `--magenta` defined once in `global.css`, so the whole app changes
  if you edit them).

- `apps/web/src/views/tasks/task-row.tsx` — **edited.** Added an import for the
  new `PriorityBadge`. Removed the old inline `<span>` that used inline _style_
  attributes (HTML attributes that set colors directly, like `style={{ color:
pr.fg }}`). Replaced it with `<PriorityBadge priority={row.priority}
className="justify-self-start" />`. Also deleted the line `const pr =
PRIORITY_STYLE[row.priority];` since `PRIORITY_STYLE` is no longer used.

- `apps/web/src/views/tasks/tasks.utils.ts` — **edited.** Deleted the entire
  `PRIORITY_STYLE` constant (a lookup table mapping priority names to color
  objects). Removed `Priority` from the _import_ statement, since it was only
  used to _type_ (describe the structure of) `PRIORITY_STYLE`. Kept `STATUS_STYLE`
  (which colors the status dropdown), since Tasks still uses it.

**Why:** a component centralizes styling logic so it is written once, used
everywhere, and easy to change. Using shadcn's `Badge` ensures the pill has
consistent behavior with the rest of the app's badge use. Removing inline styles
and hand-built color lookups makes the Tasks screen cleaner and easier to read.

**How we checked nothing broke:** a _grep_ (a search tool) confirmed that
`PRIORITY_STYLE` was only defined once, nowhere else, so it was safe to delete.
Ran the type checker (`tsc --noEmit`) — it passed. Ran the production build
(`vite build`) — it passed. Not yet committed.

---

## 2026-08-14 — Converted confidence pill to ConfidencePill component on Badge

**Plain-language summary:** the Review screen displayed a small pill on each card
showing the confidence level as a percentage and a verdict ("needs review" or
"confident"). The pill was hand-styled with inline colors and built-in logic for
different low/high states. Today we converted that into a reusable _component_
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
  (which contained the dot, percentage, and label, each with inline _style_
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
colors from `reviewStyle` makes it easier to understand at a glance: it _only_
styles the card.

**How we checked nothing broke:** a _grep_ confirmed that `pillBg`, `pillFg`,
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
reusable `cta` (_call-to-action_) variant of the shadcn `Button` component,
replacing four separate style definitions with a single, consistent variant.

**Background:** a _variant_ in shadcn's `cva` system is a named style option
you apply to a component — like `variant="outline"` or `variant="ghost"` on a
button. Under the hood, `cva` (_class-variance-authority_) generates class
strings based on variant names, and _Tailwind_ (the CSS framework) applies those
classes. A subtle ordering detail: `cva` emits classes in this order: defaults,
then variants, then _compound variants_ (special combos of two or more variant
settings). Because Tailwind's _merge_ tool lets the last class win, sizing
(`h-10`, `px-[18px]`, `text-[13.5px]`) must go in `compoundVariants` to beat the
default size's `h-9 px-4`.

**What changed:**

- `apps/web/src/components/ui/button.tsx` — **edited.** Added a new `cta` entry
  to the button's `variants.variant` list. The cta variant sets the primary
  color, rounded corners (`rounded-[13px]`), semibold weight, and the 8px glow
  shadow. Also added a new `compoundVariants` key (a first-time addition to this
  file) with one entry: when `variant="cta"` _and_ `size="default"`, apply
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

_Post-review fix (same day):_ code review caught that the enabled Save button
had lost its pointing-hand cursor (the first version passed `undefined` instead
of `{ cursor: "pointer" }` in the enabled branch — a _regression_, meaning
something that used to work stopped working). The enabled branch now restores
`cursor: "pointer"`, and the button block's _indentation_ (the leading spaces
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
block) adds a 1-pixel _transparent border_ (a thin edge that is invisible but
takes up space) to all badges by default. Our `PriorityBadge` component inherited
this border, making the pill about 2 pixels larger in each dimension than the
original hand-built version. We fixed it by adding `border-0` (a Tailwind class
that removes all borders) to disable the inherited border.

**Background:** _Tailwind_ is a CSS framework where you apply styles using short
class names like `border-0` instead of writing CSS by hand. A _CSS class_ is a
named set of styling rules. When components are _composed_ (built from other
components), they inherit styling from their base layer unless explicitly
overridden.

**What changed:**

- `apps/web/src/components/PriorityBadge.tsx` — **edited.** The base class string
  for the Badge's `className` now starts with `border-0`, moving the string from
  `"rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold"` to
  `"border-0 rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold"`.

**Why:** this is a _pixel-parity_ fix — ensuring the rebuilt component matches the
original design pixel-for-pixel. The 1px transparent border was invisible but
broke the intended sizing. Removing it makes High/Medium/Low pills render at their
intended dimensions, aligning with the design system's precision.

**How we checked nothing broke:** ran the linter (`pnpm --filter @note2action/web
lint`) — passed, catching no style issues. Ran the production build (`pnpm --filter
@note2action/web build`) — passed. The pre-existing >500 kB chunk size warning is
expected and approved.

---

## 2026-08-14 — Converted repeated styling patterns into shadcn components (plan + execution record)

**What changed at the top level:** this entry records the _process_ behind the
seven commits that landed today between `94fe4cc` and `4f35908`; each commit's
own details already have their own entries above, written as the work happened.

**Files touched by the process itself:**

- `docs/superpowers/plans/2026-08-14-shadcn-div-components.md` — **created.**
  An _implementation plan_: a step-by-step recipe written before coding, with
  the exact code each task should produce. Five tasks: a shared page-header
  component (`ViewHeader`), a stat tile built on a new progress-bar _primitive_
  (a small building-block component), two pill components built on the
  existing `Badge`, and a new `cta` look (variant) for the glowing blue button.
- The work was executed by dispatching one fresh AI _subagent_ (a helper
  session with a clean slate) per task, each followed by an independent
  reviewer subagent; review findings were fixed and re-checked before moving
  on. Notable catches: a commit that accidentally bundled an unrelated journal
  entry (unbundled, and the entry — which turned out to be real work from a
  parallel session — was restored in its own commit `ef4dc86`); a lost
  pointer-style mouse cursor on the Review screen's save button (restored);
  and a 1-pixel invisible border the new priority pill inherited from `Badge`
  (removed, so the pill measures exactly like the old one).

**Why:** the goal was to slim down repeated hard-coded styling by giving each
repeated pattern one named home, while keeping every screen looking the same
as before to the pixel (three tiny, deliberate exceptions are named in the
plan and in the entries above).

**How we checked:** every task ran the type checker and the production build;
two independent review passes (per task and whole-branch) confirmed the moved
styles match the originals value-for-value.

---

## 2026-08-14 — Renamed component files to kebab-case

**What changed:** the ten component files in `apps/web/src/components/` were
renamed from PascalCase (capital first letters, like `ViewHeader.tsx`) to
_kebab-case_ (all lowercase with hyphens between words, like
`view-header.tsx`). Only the file names changed — the components themselves,
and the names used inside the code (`ViewHeader`, `StatCard`, …), stay exactly
as they were, because React components must start with a capital letter in
code even when their files are lowercase.

**Files renamed (old → new), all in `apps/web/src/components/`:**
`AppLayout.tsx → app-layout.tsx`, `ConfidencePill.tsx → confidence-pill.tsx`,
`EmptyState.tsx → empty-state.tsx`, `PriorityBadge.tsx → priority-badge.tsx`,
`RecentModal.tsx → recent-modal.tsx`, `SectionHeading.tsx → section-heading.tsx`,
`Sidebar.tsx → sidebar.tsx`, `StatCard.tsx → stat-card.tsx`,
`StepLabel.tsx → step-label.tsx`, `ViewHeader.tsx → view-header.tsx`.

**Files edited to match (their `import` lines point at the new names):**
`App.tsx`, `components/app-layout.tsx`, and six view files
(`views/review/review.view.tsx`, `views/review/review-card.tsx`,
`views/tasks/tasks.view.tsx`, `views/tasks/task-row.tsx`,
`views/history/history.view.tsx`, `views/capture/capture.view.tsx`).

**Why:** the rest of the project already uses lowercase file names — the
shadcn primitives (`ui/button.tsx`), the view files (`capture.view.tsx`), and
the earlier extracted pieces (`review-card.tsx`, `task-row.tsx`). One naming
style everywhere means no guessing, and it avoids a classic trap: Mac laptops
treat `Sidebar.tsx` and `sidebar.tsx` as the same file, but the Linux build
servers that ship the app do not, so mixed casing can build locally yet break
in deployment. The renames used `git mv` (git's rename command), which records
a rename rather than a delete-plus-create, keeping each file's history.

**How we checked nothing broke:** the type checker (`tsc`) — which caught one
missed spot, two imports inside `app-layout.tsx` that still pointed at the old
capitalized names — and the production build (`vite build`); both now pass.
Not yet committed.

---

## 2026-08-14 — Extracted view layout wrappers into ViewShell, ScrollRegion, and Toolbar

**What changed:** three tiny _layout components_ (components whose only job is
arranging space, not showing content) were created, and the five screens now
use them instead of repeating the same long lists of styling classes.

**Files created (all in `apps/web/src/components/`):**

- `view-shell.tsx` — `ViewShell`, the outer frame of every screen: plays the
  entrance animation and stretches to fill the window column. Screens with a
  twist pass extra classes: Capture caps its width; Home makes the whole frame
  scrollable.
- `scroll-region.tsx` — `ScrollRegion`, the scrolling area inside a screen. It
  owns only the scrolling rules, including the small negative-margin trick
  (`-mr-1 pr-1`) that nudges the scrollbar off the content's edge. What is
  _inside_ the region — a column of rows (Tasks, History) or a grid of cards
  (Review) — stays written at each screen, passed in as classes.
- `toolbar.tsx` — `Toolbar`, the row of filters/actions that sits between a
  screen's header and its content (used by Review and Tasks, each with its own
  gap size).

**Files edited (all five view files):** `views/review/review.view.tsx`,
`views/tasks/tasks.view.tsx`, `views/history/history.view.tsx`,
`views/capture/capture.view.tsx`, `views/home/home.view.tsx` — each swapped
its hand-written wrapper `<div>`s for the new components.

**Why:** the same long class strings were copy-pasted across screens; when the
same idea lives in five places, a fix must be made five times and the copies
drift apart. Each component merges its base classes with whatever the caller
passes using the project's `cn()` helper, so per-screen differences remain
visible right where that screen is defined. The screens render pixel-identical
markup — the classes moved, none changed.

**How we checked nothing broke:** the type checker (`tsc`) and the production
build (`vite build`) both pass, and a search confirmed no view still carries
the old repeated class recipes. Not yet committed.

---

## 2026-08-14 — Grouped app components into components/app/ and split the last big files

**What changed:** four related hygiene steps, agreed with the project owner
after weighing which splits are worth their cost (over-splitting is its own
problem: many tiny files and import-hopping with no gain).

**1. New home for the app's own components.** The `components/` folder mixed
two kinds of files: shadcn _primitives_ (ready-made basics like `button.tsx`,
kept in `components/ui/`) and components written for this app. The thirteen
app-specific ones moved into a new `apps/web/src/components/app/` folder, so
the split is now obvious at a glance: `ui/` = building blocks we didn't write,
`app/` = ours. Every `import` line pointing at them was updated.

**2. One dropdown to rule the filters.** The owner/status filter dropdowns on
Tasks (two) and History (one) were three hand-built copies of the same thing.

- `components/app/filter-select.tsx` — **created.** `FilterSelect` takes the
  current value, a change handler, the "All …" label, and the option list.
- `views/tasks/tasks.view.tsx`, `views/history/history.view.tsx` — **edited**
  to use it; each dropped ~20 lines of duplicated markup.

**3. Sidebar slimmed (200 → ~90 lines).** Three self-contained pieces moved
out, each into `components/app/`: `slot-number.tsx` (the slot-machine
percentage animation — 60 lines of pure animation logic), `sidebar-nav.tsx`
(the WORKSPACE links plus the Review count badge), and `completion-card.tsx`
(the "Completion this month" widget). The small brand header, theme toggle,
and user footer deliberately stay inline — they are single-use and tiny, so
extracting them would add files without adding clarity.

**4. Views finished their decomposition.** Following the existing pattern
where a screen's pieces live beside it:

- `views/history/history-row.tsx` — **created**; the ✓/title/owner/date/Reopen
  row left `history.view.tsx` (now 74 lines).
- `views/capture/notes-editor.tsx` and `views/capture/recent-captures.tsx` —
  **created**; the editor card and the RECENT strip left `capture.view.tsx`,
  which shrank from 151 to 34 lines and now reads as: header, editor, recents.
- `views/home/recap-card.tsx` — **created**; `RecapCard` moved out of
  `home.view.tsx`.

**Why:** every screen file is now a short skeleton naming its parts, and each
part has one clear job in its own small file — easier to read, easier to
change safely.

**How we checked nothing broke:** the type checker (`tsc`) and production
build (`vite build`) pass; all markup moved verbatim, so the app looks and
behaves identically. Not yet committed.

---

## 2026-08-14 — Enforced the three-file rule for view folders

**What changed:** the project owner set a structural rule: each folder under
`apps/web/src/views/` may hold only three files — the screen itself
(`<name>.view.tsx`), its helpers (`<name>.utils.ts`), and its screen-local
state (`<name>.store.ts`). Six component files living beside their screens
were therefore moved into the shared `apps/web/src/components/app/` folder.

**Files moved (old location → `components/app/`):**

- `views/review/review-card.tsx` → `components/app/review-card.tsx`
- `views/tasks/task-row.tsx` → `components/app/task-row.tsx`
- `views/history/history-row.tsx` → `components/app/history-row.tsx`
- `views/capture/notes-editor.tsx` → `components/app/notes-editor.tsx`
- `views/capture/recent-captures.tsx` → `components/app/recent-captures.tsx`
- `views/home/recap-card.tsx` → `components/app/recap-card.tsx`

**Files edited:** the five `*.view.tsx` files now import those components from
their new `@/components/app/...` paths, and two of the moved files updated
their own imports: `review-card.tsx` and `task-row.tsx` used _relative_
imports (paths starting `./`, meaning "in my own folder") to reach their old
neighbors `review.utils.ts` and `tasks.utils.ts`; those became full
`@/views/...` paths since the files are no longer neighbors.

**Why:** this trades the previous "pieces live beside their screen" layout for
a stricter, simpler rule — every screen folder looks identical, and all
components (shared or not) live in one place. Both layouts are legitimate;
the owner chose predictability. The trio keeps the view-name prefix
(`tasks.view.tsx`, not a bare `view.tsx`) so open editor tabs stay tellable
apart.

**How we checked nothing broke:** the type checker (`tsc`) and the production
build (`vite build`) both pass after the moves. Not yet committed.

---

## 2026-08-14 — Saved the finished repo structure as a personal default (outside the repo)

**What changed:** no project code was touched. At the owner's request, the
assistant wrote the repository's final structure to its private _memory
folder_ (a directory outside this repo, at
`~/.claude/projects/-Users-macbook-note2action/memory/`, that future assistant
sessions read on startup), as the default way to organize any future project.

**Files touched (both outside the repo, untracked by git):**

- `.../memory/preferred-project-structure.md` — created. Records the pnpm
  monorepo layout, the `components/ui` vs `components/app` split, the
  three-file rule for view folders, kebab-case naming, and the
  when-to-extract-a-component rules of thumb.
- `.../memory/MEMORY.md` — updated. The index (table of contents) of saved
  notes gained a line pointing at the new one.

**Why:** the owner wants new projects to start with this structure by default
instead of re-deriving it, unless he says otherwise.

---

## 2026-08-14 — Fixed the journal reminder so it stops crying wolf

**What changed:** the _Stop hook_ (the small script that runs whenever the
assistant tries to finish its turn, defined in `.claude/settings.json`) was
blocking **every** turn that edited files — even when the journal entry it
demands had already been written. That is why a "stop hook error" appeared
after nearly every prompt today.

**File touched:** `.claude/settings.json` — the Stop hook's command was
rewritten.

**Why it misfired:** the system works with a _flag file_ (an empty file whose
only meaning is "edits happened"). Editing any file raised the flag; the only
thing that ever lowered it was the Stop hook itself — in the same moment it
blocked. Nothing ever recorded "the journal is already up to date," so one
spurious block per editing turn was guaranteed by design.

**The fix:** the Stop hook now compares _timestamps_ (the "last modified"
time the computer stores for every file). If `memory.md` was modified more
recently than the flag was raised, the journal is considered up to date: the
hook clears the flag and lets the turn end quietly. It only blocks when edits
happened and `memory.md` truly was not updated afterward. The enforcement is
unchanged — only the false alarms are gone.

**How we checked:** the new command was tested by piping it fake inputs for
all four situations (journal newer → silent pass; flag newer → block; no flag
→ pass; repeat-block guard → pass) before installing, and the settings file
was validated as correct JSON afterward. Not committed — `.claude/` is
currently untracked.

---

## 2026-08-14 — Wrote the project roadmap and learning plan

**What changed:** one new document; no code was touched.

**File created:** `docs/roadmap.md` — the owner's original rough project
outline (a paste of pre-project notes) turned into a structured, thirteen-
module plan written for a beginner. Each module states what to build, what it
teaches, and how to prove it works. A _module_ here is one self-contained
chunk of the project — like one lesson in a course.

**Why:** the rough notes mixed finished work, half-decisions, and future
ideas. The roadmap sorts them into three phases — Phase A (foundations and
the product screens, Modules 1–7, all complete), Phase B (database, auth, and
tooling, Modules 8–13, not started), and Phase C (polish) — and marks exactly
where the project stands: everything up through the code-hygiene pass is
done; the next step is Module 8, writing the API-design and database-schema
documents before any database code.

**How we checked:** the status marks were verified against the repository
itself — e.g. `docker-compose.yml` has no Postgres service yet, `apps/api`
has no Alembic or pydantic-settings, and the AI app's `/api/extract` and
`/api/chat` routes exist and are wired into the UI.

---

## 2026-08-14 — Created the backend course syllabus

**What changed:** one new document; no code was touched.

**File created:** `docs/course/README.md` — the remaining roadmap modules
(8 through 13) rewritten as a mentor-led course for the project owner. Each
module has three fixed parts — _what_ will be implemented, _why_ it matters,
and _how_ to do it manually, step by step — plus 📖 terminology boxes that
define each new concept (ORM, migration, JWT, middleware, row-level
security, and so on) the first time it is needed, and a checkpoint that must
pass before moving on.

**Why:** the owner asked to learn by doing — he writes the code from here,
with the assistant explaining, reviewing, and un-sticking rather than
implementing. The course locks in that arrangement and the order of work:
design docs first (Module 8), then Postgres with migrations (9), real
persistence in the UI (10), database/API tooling literacy (11),
authentication (12), and row-level security (13).

**How we checked:** the module contents were cross-checked against
`docs/roadmap.md` and the actual repository state so the course starts
exactly where the code currently stands.

---

## 2026-08-14 — AI-output labels on every gateway response (ticket #32, other repo)

**Heads-up:** this session's work happened in a _different_ repository —
`/Users/macbook/Blen/agency-intelligence` (the government AI gateway), on a
new branch `feat/32-ai-output-labeling`. Nothing in `note2action` changed.
Nothing is committed yet — Kyle reviews first.

**What changed:** the gateway (the one server every AI request must pass
through) now attaches a small "label" to every AI response so that, months
later, anyone can prove a document was AI-generated and look up its audit
record. The label is two HTTP response _headers_ (headers are small
key–value notes that travel with a web response, separate from its main
content): `x-ai-response-id` — a UUID (a practically unguessable random
128-bit identifier) invented by the _server_, never by the caller — and
`x-ai-response-timestamp`, the moment the response was issued, in UTC.
The same id is also written into the audit _ledger_ (an append-only
database table — rows can be added but never edited or deleted), so the
header on the response and the row in the ledger share one key and can be
joined later.

**Files (all under `/Users/macbook/Blen/agency-intelligence`):**

- `apps/api/app/api/v1/label_middleware.py` (new) — the labeler, written as
  _middleware_: a function that wraps every request/response, letting you add
  behavior without editing each route. It invents the id _before_ the route
  runs, parks it on `request.state` (a scratch area that lives only for that
  one request), and stamps both headers on the way out.
- `apps/api/app/api/v1/ledger_middleware.py` — a ~12-line change: the ledger
  now reuses that pre-invented id as its unique `request_id` (with a
  fallback that invents its own if the labeler is absent — so the security
  guarantee that callers can never choose the audit key survives).
- `apps/api/app/main.py` — registers the new middleware. Order matters:
  middleware registered _later_ wraps everything registered earlier (LIFO,
  "last in, first out"), so the labeler sits outermost and even error
  responses from the inner layers get labeled.
- `apps/api/tests/test_v1_labeling.py` (new) — 19 tests written _first_, in
  TDD style (test-driven development: write a failing test, watch it fail,
  then write just enough code to pass — the failure proves the test really
  checks something). They include security tests proving an attacker cannot
  inject or pin the label via request headers.
- `docs/observability-contract.md` — documents the header contract and tells
  downstream systems to store the three header values with any saved AI
  output; `docs/PLANS.md` — the required working plan for the ticket.

**Why:** an oversight body (OIG) flagged that AI outputs could not be
retrospectively identified. A platform-issued, tamper-proof label that
resolves to an immutable ledger row is that mechanism (ticket #32 / FR-8).

**How we checked:** the repo's full local gate `bun run verify` passed —
460 API tests (19 new), coverage 91% against a 90% minimum (coverage =
the share of code lines exercised by tests; the new file is at 100%), plus
lint, type checks, contract checks, and the web/mobile/SDK suites.

---

## 2026-08-14 — Ticket #32 manually verified, committed, and PR #90 opened (other repo)

**Heads-up:** again in `/Users/macbook/Blen/agency-intelligence`, not
`note2action`. No new source-code edits this round — this entry records the
verification and shipping steps that followed the previous entry's work.

**What changed:**

1. **Manual verification.** The owner ran the 19 new tests himself
   (`pytest tests/test_v1_labeling.py -v` — all passed) and we stood up the
   API for live checks: started the project's Postgres database in a Docker
   _container_ (a lightweight, isolated box that runs one program with
   everything it needs), applied the _migrations_ (versioned scripts that
   build the database tables step by step) with Alembic, and ran the server
   with _uvicorn_ (the program that hosts a Python web app and listens on a
   network _port_ — a numbered door on your computer). Port 8000 was taken
   by the note2action dev server, so we used 8010. Even an unauthenticated
   request came back `401 Unauthorized` **with** the new label headers —
   which is exactly the acceptance criterion "every response carries the
   label". Afterwards the server and the Postgres container were shut down.

2. **Commit and pull request.** The six files from the previous entry were
   committed (a _commit_ is a saved snapshot with a message explaining the
   change) as `adb3323` on branch `feat/32-ai-output-labeling`, _pushed_
   (uploaded to the shared copy on GitHub), and opened as _pull request_
   #90 — a PR is a request for teammates to review a branch before it is
   merged into the main code line. The PR description was filled from the
   repo's template (summary, verification evidence, risk and rollback,
   observability) and later edited at the owner's request so all
   accountability checkboxes are marked and no personal account is named.

**Files:** repo `/Users/macbook/Blen/agency-intelligence`, branch
`feat/32-ai-output-labeling` (commit `adb3323`: `label_middleware.py`,
`ledger_middleware.py`, `main.py`, `test_v1_labeling.py`, `docs/PLANS.md`,
`docs/observability-contract.md`). The PR text was drafted in a scratch
file outside both repos. Nothing in `note2action` changed except this
journal.

**Why:** the ticket's workflow demands evidence before claims — the owner
wanted to see the tests pass and the headers appear with his own eyes
before publishing. Pushing and opening PR #90
(https://github.com/blencorp/agency-intelligence/pull/90) is the handoff
for team review and CI (the _continuous integration_ service that re-runs
all checks automatically on GitHub).

**How we checked:** owner-run pytest output (19/19 passed), a live `curl`
returning the label headers on port 8010, `bun run verify` green on the
committed tree, and the PR visible at the URL above.

---

## 2026-08-14 — Fixed PR #90's failing "accountability" check (other repo)

**Heads-up:** work concerns `/Users/macbook/Blen/agency-intelligence`
PR #90; no source code changed anywhere — only the PR _description_ (the
text box on GitHub that explains a pull request) and my own notes.

**What changed:** the repo runs a CI job called `accountability` that
_parses_ (reads and interprets, character by character) the PR description
against the team's template. It rejected ours because the line
`Lifecycle state:` said `shipped` plus an explanation in parentheses —
but the checker only accepts one of five exact words: `proposal`, `trial`,
`adopted`, `sunset`, `deleted` (an _enum_ — a fixed list of allowed
values), alone on its line. We changed the value to `adopted` (right for a
feature that ships turned on) and moved the explanation to the next line.
The check re-ran automatically on the edit and now passes; every check on
PR #90 is green.

**Files:**

- `/Users/macbook/.claude/jobs/d073da1b/tmp/pr-body-32.md` — the scratch
  copy of the PR description, edited and re-uploaded with
  `gh pr edit 90 --body-file ...` (the `gh` tool drives GitHub from the
  command line).
- `/Users/macbook/.claude/projects/-Users-macbook-note2action/memory/agency-intelligence-pr-template-gate.md`
  (new, plus an index line in `MEMORY.md` next to it) — the assistant's
  persistent note recording every format rule that checker enforces
  (exact lifecycle words, single-value risk level, bare `YYYY-MM-DD`
  review date, eight checkbox sentences kept verbatim), so future PRs in
  that repo pass on the first try.

**Why:** the owner asked to fix the failing check and to memorize the rule
so it never bites again. The lesson: some CI checks validate _prose_, not
code — the template text is itself a machine-read contract, so its exact
wording matters as much as the code.

**How we checked:** the workflow file
(`.github/workflows/pr-accountability.yml`) was read to learn the real
allowed values instead of guessing; after the edit, `gh pr checks 90`
reported `accountability  pass`.

---

## 2026-08-14 — New rule: no AI attribution in commits or PRs

**What changed:** the owner set a standing rule — nothing authored on his
behalf may mention the AI assistant: no `Co-Authored-By` _trailer_ (a
machine-readable key-value line at the end of a commit message that
credits an extra author) and no "Generated with…" footer in PR
descriptions. The rule was saved to the assistant's persistent memory so
it applies to every future commit and PR, and the open PR #90 description
in `/Users/macbook/Blen/agency-intelligence` was re-edited to drop its
footer. One template sentence ("I reviewed agent-generated changes…")
remains because the repo's own CI check requires that exact wording. The
existing commit `adb3323` still carries the old trailer; the owner chose
to leave it, since a _squash merge_ (combining a branch's commits into one
new commit at merge time, with an editable message) can drop it later.

**Files:**

- `/Users/macbook/.claude/projects/-Users-macbook-note2action/memory/no-claude-attribution.md`
  (new) plus its index line in `MEMORY.md` — the persistent rule.
- `/Users/macbook/.claude/jobs/d073da1b/tmp/pr-body-32.md` — footer removed,
  re-uploaded with `gh pr edit 90`. No repository source files changed.

**Why:** the owner wants his project history free of AI attribution.

**How we checked:** after the edit, searching the live PR #90 description
for "claude / co-authored / generated" matched only the CI-required
template sentence, and the `accountability` check still passes.

## 2026-08-16 — Module 8: the database schema, designed on paper

**WHAT changed:** Created the first design document for the database:
`docs/database-schema.md`. No code — it's a diagram plus the reasoning
behind it.

**WHICH files:** `docs/database-schema.md` (new).

**WHY:** Module 8 of the course is "design on paper first": we walked every
screen, listed every piece of data, and sorted it into _stored_ (must live
in the database) versus _derived_ (computed from other data on demand —
never stored, because stored copies drift out of sync). The stored fields
became three tables: `users` (today a hard-coded constant in the frontend),
`meetings` (what makes the Recent-captures strip real — it's currently fake
data), and `action_items` (title, owner, due, priority, confidence, status,
saved, note, completed).

Terms worth knowing:

- **ER diagram** (entity-relationship): boxes are tables, lines are
  relationships — the standard way to sketch a database before building it.
  Ours is written in mermaid, a text format that renders as a picture.
- **Foreign key (FK):** a column holding another table's id, e.g.
  `action_items.meeting_id` points at `meetings.id`. The database enforces
  that the target row actually exists.
- **Nullable:** a column allowed to be empty (`NULL`). `due` is nullable
  because the AI sometimes finds no date.
- **CHECK constraint:** a rule the database enforces on a column, e.g.
  `status` may only be one of four exact strings — garbage gets rejected.

Key decision recorded in the doc: `owner` is plain text, _not_ a foreign
key to `users`, because owners are people mentioned in notes — most can't
log in, and a FK would break extraction for unknown names.

## 2026-08-16 — Module 8: the API contract, designed before the code

**WHAT changed:** Created `docs/api-design.md` — every endpoint the finished
product needs, written down before any handler exists. Together with
`docs/database-schema.md` this completes the two written halves of Module 8.

**WHICH files:** `docs/api-design.md` (new).

**WHY:** An API is a _contract_: the frontend and backend agree on exact
request and response shapes before either side is built, so they can be
built (and tested) independently. Designing it on paper is cheap; changing
a live endpoint both sides depend on is not.

Terms worth knowing:

- **Endpoint:** one URL + HTTP method the server answers, e.g.
  `PATCH /api/items/{id}`. The method carries meaning: GET reads, POST
  creates, PATCH partially updates, DELETE removes.
- **422 vs 404:** 422 means "your request body is malformed or fails
  validation"; 404 means "the thing you addressed doesn't exist".
- **Atomic / transaction:** a group of writes that succeed or fail as one —
  e.g. creating a meeting _and_ its items; you never end up with half.
- **Server-authoritative:** a value only the server may set. `completed` is
  one — the server stamps it when status becomes Done, because the client's
  clock can't be trusted.

Design decisions recorded in the doc: items are persisted at _extraction_
time (not at Save-to-Tasks) so the Review queue survives refresh; "Save N
to Tasks" is one batch endpoint rather than N single updates; UI filters
stay client-side for now. Also flagged: the shared `Item` zod schema is a
placeholder that Module 10 must replace with the real `ActionItem` shape.

## 2026-08-17 — Module 8 complete: per-service architecture diagrams

**WHAT changed:** Finished the last Module 8 deliverable — one mermaid
flowchart per service showing how it works _inside_, plus a corrected
system overview.

**WHICH files:** `docs/architecture/web.md`, `docs/architecture/api.md`,
`docs/architecture/ai.md` (new); `docs/architecture/overview.md` (updated —
it wrongly showed the browser calling the AI app directly; in reality every
AI request goes through the web dev server's `/ai-api` proxy, which rewrites
the path to `/api/*`).

**WHY:** The overview answers "what talks to what"; the per-service docs
answer "what happens inside each box". Each one encodes a rule that keeps
the codebase sane: web — views never touch the network (view → store →
api layer → fetch); api — routes never hold data (route → repository seam →
storage, which is how Module 9 swaps in Postgres without touching a route);
ai — a stateless transformer where only `lib/provider.ts` knows which model
runs, and secrets never reach the browser.

Terms worth knowing:

- **Proxy:** the dev server forwards requests matching a prefix (`/api/*`)
  to another server, so the browser only ever talks to one origin — which
  also sidesteps CORS (the browser rule blocking cross-origin requests).
- **Seam:** a deliberate interface where one implementation can be swapped
  for another without callers noticing — `ItemRepository` is ours.
- **Stateless:** a service that stores nothing between requests; the ai app
  transforms input to output and forgets.

With this, Module 8 (design on paper) is done: schema, API contract, and
architecture docs all exist before the database does. Module 9 implements
the schema for real: Postgres in docker-compose, SQLAlchemy models, Alembic
migrations.

## 2026-08-17 — Review fixes: query defaults, devtools, and the whole tooling track

**WHAT changed:** Four things from the latest code review. (1) The web app's
QueryClient now has default options instead of being created bare. (2) The
React Query devtools panel is finally rendered. (3) The repo got its missing
tooling: ESLint, Prettier, Vitest with the first 33 tests, and a husky
pre-commit hook — and the `lint` script now actually lints instead of
type-checking. (4) `logs/` is gitignored so tool logs can never be committed
(the review claimed `src/logs/*.json` files were committed, but they don't
exist anywhere in the tree or in git history — nothing to delete).

**WHICH files:** `apps/web/src/providers.tsx` (query defaults + devtools);
`eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `.husky/pre-commit`
(new tooling config); `package.json`, `apps/web/package.json`,
`apps/ai/package.json` (scripts relabeled: `lint` runs ESLint, `typecheck`
runs `tsc --noEmit`, plus `format`, `test`, `prepare`, and a `lint-staged`
config); `apps/web/vitest.config.ts`, `apps/web/src/test/fixtures.ts`, and
five `*.test.ts` files next to `lib/dates.ts`, `lib/items.ts`, and the three
view `*.utils.ts` files; `.gitignore` (`logs/`). Prettier also reformatted
~37 existing files once so future diffs stay clean.

**WHY:** TanStack Query — the library that fetches and caches server data —
defaults to `staleTime: 0`, meaning cached data is considered stale ("too
old to trust") immediately, so every remount refetched `/api/health`; a 30s
`staleTime` serves the cached answer instead. `retry: 1` means one retry on
failure instead of three. The devtools panel is a floating inspector that
shows every query's cache state in the browser (dev builds only — it
compiles away in production).

Terms worth knowing:

- **Linter (ESLint):** a program that reads source code and flags likely
  bugs (unused variables, misused React hooks) without running it. The old
  `lint` script ran the TypeScript compiler's type check — useful, but a
  different job, so it was renamed `typecheck`.
- **Formatter (Prettier):** rewrites code to one canonical style so diffs
  only ever show real changes, never spacing arguments.
- **Vitest:** the test runner; each `*.test.ts` file states facts the code
  must keep true (e.g. "undated tasks sort last") and fails loudly when a
  change breaks one. Tests run with `TZ=UTC` because two date helpers use
  UTC-based `toISOString()` — note: `weekOf()` would return the wrong day
  for users in UTC+ timezones; latent bug, flagged to Kyle.
- **husky + lint-staged:** a git pre-commit hook — a script git runs before
  every commit — that lints and formats only the files being committed, so
  broken or unformatted code can't even be committed.

## 2026-08-17 — Split the working tree into eight clean commits

**WHAT/WHICH:** The review-fix work plus the long-uncommitted docs landed as
eight focused commits on `refactor/web-restructure` (`ebccee7..b69a822`):
query defaults, devtools, tooling, tests, prettier baseline, claude-code
hooks config, project docs, journal. Also new: `.claude/settings.local.json`
is now gitignored — it's a per-machine permissions file, not shared config.

**WHY one change per commit:** each commit is a single revertable,
explainable step; `git log` now reads as a story instead of one blob.
`docker-compose.yml` was deliberately left uncommitted — a postgres service
appeared in it mid-session (Module 9 work in progress, not part of this
series). Note: it currently fails `pnpm format:check`; the pre-commit hook
will auto-fix that whenever it gets committed.

## 2026-08-17 — Module 9 step 1: Postgres is running; docs aligned to port 5432

**WHAT changed:** Kyle added the `postgres` service to `docker-compose.yml`
himself (image `postgres:17.1-alpine`, named volume `postgres_data`, host
port 5432) and passed the durability checkpoint: a `canary` table survived
`docker compose down` + `up`, proving the named volume keeps data alive
across container restarts. The docs were then updated to match reality —
the plan said host port 5433 as a collision-avoiding default, but 5432 was
verified free on this machine (Docker bound it successfully), so we kept
the standard port.

**WHICH files:** `docker-compose.yml` (Kyle, by hand);
`docs/course/README.md`, `docs/roadmap.md`, `docs/architecture/overview.md`,
`docs/architecture/api.md` (port references 5433 → 5432, and the example
DATABASE_URL now shows the real local credentials).

**WHY:** Docs that disagree with the running system are worse than no docs —
every future connection string, DBeaver setup, and settings default flows
from this port and these credentials, so the written record has to match
what `docker compose config` actually says.

Terms worth knowing:

- **Host port vs container port** (`"5432:5432"`): the right side is the
  port inside the container (Postgres always thinks it's on 5432); the left
  side is the door on your machine. Other containers use the service name
  and container port (`postgres:5432`); tools on your Mac use
  `localhost:<host port>`.
- **Named volume:** Docker-managed disk space that outlives the container.
  `docker compose down` keeps it; `down -v` deletes it.
- **First-boot gotcha:** the `POSTGRES_*` env vars are only read when the
  data volume is empty — changing them later does nothing without a wipe.

## 2026-08-17 — Database renamed to note2action

**WHAT changed:** Kyle renamed the database from the default `postgres` to
`note2action` (edited `POSTGRES_DB` in `docker-compose.yml`, then wiped and
re-initialized with `docker compose down -v && up` — required because the
`POSTGRES_*` env vars are only read into an empty data volume). Verified
live: `SELECT current_database()` returns `note2action`. The one stale doc
reference was updated to match.

**WHICH files:** `docker-compose.yml` (Kyle, by hand);
`docs/course/README.md` (the example DATABASE_URL now ends in
`/note2action`).

**WHY:** A database named after the project makes every connection string,
psql prompt, and DBeaver session self-describing. Doing the rename now was
deliberate timing: the wipe only cost a throwaway table — once real data
lands, `down -v` becomes destructive and renames stop being casual.

## 2026-08-17 — Module 9: SQLAlchemy models — the ER diagram becomes code

**WHAT changed:** Kyle wrote `apps/api/app/models.py` (three ORM classes:
User, Meeting, ActionItem) and fixed two bugs himself (a missing import,
and a foreign key placed in the wrong table). The mentor then fixed the
remaining type mix-ups: `Mapped[DateTime]` → `Mapped[datetime]` for
captured_at, `DateTime | None` → `date | None` for due and completed,
`owner` made required (the AI writes "Unassigned" instead of nothing),
`saved` given `default=False`, `ondelete="CASCADE"` added to the
meeting_id foreign key, and the unused `Boolean` import removed. Verified:
`Base.metadata` registers all three tables.

**WHICH files:** `apps/api/app/models.py`. (Earlier this session, also by
Kyle: `app/models.py` → `app/schemas.py` rename, `app/settings.py`,
`apps/api/.env` + `.env.example`, and the postgres service in
`docker-compose.yml`.)

**WHY (the idea behind the mentor's fixes):** SQLAlchemy code mentions two
different "type" worlds. Inside `Mapped[...]` you name the _Python_ type —
what your program holds in memory (lowercase `datetime`, `date`, `str`).
Inside `mapped_column(...)` you name _database_ things — what Postgres
stores (`DateTime(timezone=True)`, `Text`). Capital-D `DateTime` is the
database one; lowercase `datetime` is the Python one. Mixing them is the
single most common beginner error in modern SQLAlchemy.

Terms worth knowing:

- **`date` vs `datetime` (Python):** `date` is a calendar day (2026-08-17,
  no clock); `datetime` is an exact moment (day + time + timezone). Due
  dates and completion days are `date`s; "when Extract ran" is a moment.
- **Default:** a value the database fills in when the app doesn't say —
  new rows start `saved=false` (the Review queue) automatically.
- **`ondelete="CASCADE"`:** delete a meeting and the database deletes its
  action items too, keeping the schema-doc promise.

## 2026-08-17 — Module 9: the repository swap — Postgres behind the seam

**WHAT changed:** The API can now serve items from the real database.
New `app/db.py` (engine + session factory), `PostgresItemRepository` in
`app/repository.py` (same interface as the in-memory one, answers from the
`action_items` table, translating DB rows into the old wire shape),
a `repository` switch in `app/settings.py` (default `"memory"`; `.env` sets
`postgres` for real runs), a chooser in `app/main.py` picking the
implementation in one place, and `tests/test_items.py` pinning the
in-memory repository so tests never need Docker. Tests: 2 passed.

**WHICH files:** `app/db.py` (new), `app/repository.py`, `app/settings.py`,
`app/main.py`, `apps/api/.env` + `.env.example`, `tests/test_items.py`.

**WHY:** This is the payoff of the Module 2 "seam": endpoints only know the
repository's method names, so swapping a Python list for Postgres changed
zero endpoint code. The translation in the repository (int id → str,
status → done bool) shows storage shape and wire shape are allowed to
differ — the repository is where they meet, until Module 10 upgrades the
shared contract.

Bugs met on the way (all instructive):

- pydantic-settings rejected `REPOSITORY=postgres` until the field existed —
  every `.env` line must match a declared field (typo protection).
- **Name shadowing:** `import app.main` after `from app.main import app`
  silently rebinds `app` from the FastAPI object to the package.
  "'module' object is not callable" / "'FastAPI' object has no attribute
  'main'" both trace to that one ambiguity. Fix: `import app.main as
main_module` so each thing keeps its own name.

## 2026-08-17 — Module 9 complete: durable data, end to end

**WHAT changed:** Fixed the last bug in `PostgresItemRepository` — a
leftover `return` on the line above the row-to-Item translation made the
translation _dead code_ (code after a return never runs), so the endpoint
returned raw ActionItem objects and failed serialization with a 500. The
bug was invisible while the table was empty (raw `[]` validates fine) and
only appeared once a real row existed — a textbook argument for testing
with at least one real row. Also confirmed the Module 9 checkpoint: a row
inserted via psql survived `docker compose down` + `up`, and the API now
serves it as `{"items":[{"id":"2","title":"Survive a restart",...}]}`.

**WHICH files:** `app/repository.py` (removed the dead-code return).

**WHY id=2, not 1:** the earlier deliberately-rejected `'URGENT'` insert
burned id 1 — Postgres identity sequences hand out numbers before the
insert is validated and never reclaim them. Id gaps are normal.

Debugging pattern that cracked it: test each layer separately — psql
(database: row there), fresh Python process (repository: returns raw
object → aha), then the running server. The 500 the client sees is
deliberately vague; the layers tell the truth.

## 2026-08-18 — agency-intelligence #18: workload identity federation as a credential type

**WHAT changed:** Built ticket #18 for the agency-intelligence platform (in
its own repo, not note2action): production workloads can now authenticate
with an Entra ID (Azure Gov) _workload identity_ instead of a long-lived API
key. A workload identity is an account that belongs to a program (a service),
not a person; _federation_ means our platform trusts tokens issued by
Microsoft's login service for that identity instead of storing any secret
ourselves. The platform stores only a binding — "tokens from issuer X about
subject Y belong to use case Z" — so there is no key to leak. The workload
presents a _JWT_ (JSON Web Token: a signed, expiring blob of claims like
"who am I" and "who is this for"), and the API verifies the signature
against the tenant's _JWKS_ (JSON Web Key Set: the issuer's published public
keys), checks audience and expiry, then resolves the identity to its one use
case. Where federation isn't configured (dev), federated tokens get an
explicit 503 "not configured" and the old API-key path keeps working — a
clean fallback, never loosened auth.

**WHICH files** (all under `/Users/macbook/Blen/agency-intelligence-wt/feat-18-entra-workload-identity`,
a _git worktree_ — a second checkout of the same repo so the main checkout's
branch stays untouched — on branch `feat/18-entra-workload-identity`):

- `apps/api/app/models/use_case.py` — new `CredentialType` enum; `Credential`
  gains `credential_type`, `federated_issuer`, `federated_subject`; a CHECK
  constraint (a database rule that rejects rows violating a condition) forces
  api_key rows to have key material and federated rows to have identity
  fields, never both; unique (issuer, subject) so one identity maps to
  exactly one use case.
- `apps/api/alembic/versions/20260818_000005_federated_credentials.py` — the
  _migration_ (a scripted, reversible schema change) using batch mode so it
  replays on SQLite (tests) and PostgreSQL (production).
- `apps/api/app/helpers/federation.py` — new: JWKS client cache, token
  verification, (issuer, subject) → use case resolution.
- `apps/api/app/helpers/credentials.py` — factored `credential_is_live()`
  (active + unexpired) so both auth paths share one liveness rule.
- `apps/api/app/api/use_cases/routes.py` — two endpoints:
  `POST /use-cases/{id}/credentials/federated` (register a binding) and
  `POST /credentials/federated/resolve` (token → use case), with
  machine-readable `federated_auth_*` log events.
- `apps/api/app/core/config.py`, `.env.example` — `ENTRA_FEDERATION_JWKS_URL`
  - `ENTRA_FEDERATION_AUDIENCE`; both blank (dev) = federation off.
- Tests (written first, watched fail, then made green — TDD):
  `apps/api/tests/test_federated_credentials.py`,
  `test_federated_stub_idp.py` (a _stub IdP_: a tiny local HTTP server
  publishing a real RSA public key, so signature checks are real, not
  mocked), `test_federated_credentials_migration.py` (upgrade AND downgrade).
- Docs: `docs/authentication.md` federation section,
  `docs/plans/2026-08-18-18-entra-workload-identity-federation.md` (plan went
  to `docs/plans/` because `docs/PLANS.md` is owned by open PR #90).

**WHY:** NFR-4 says production credentials should be workload identities,
not long-lived keys — a stolen API key works until someone notices; a
federated token expires in minutes and the private key never leaves
Microsoft's vault. The migration first targeted the wrong parent revision
(read the migration list from the _old_ checkout, which was behind main);
the repo's single-head guard test caught it — worktrees can differ from the
checkout you explored first, so always read state from the tree you build in.
Verification: full `bun run verify` + `verify:contracts` green (API: 673
passed / 92.92% coverage, web + mobile + sdk suites all passing). Not yet
committed — awaiting Kyle's go-ahead.

## 2026-08-18 — #18 security review + naming/hygiene pass

**WHAT changed:** Security-reviewed the ticket #18 branch as a government
gateway (checked for _vulnerabilities_ — flaws an attacker could exploit —
and _secret exposure_ — private values like keys or passwords leaking into
code, logs, or responses). Found no exploitable issues; the review notes are
in the session log. Then made naming uniform: renamed the helper
`verify_workload_token` → `verify_federated_token` (everything else says
"federated token", and uniform names make code searchable) and the log
events `credential_federated_*` → `federated_credential_*` (so all events
for this feature share one `federated_` prefix — log events are the
machine-readable breadcrumbs the platform emits so failures can be
diagnosed automatically). Re-ran the hygiene tools: _black_ (auto-formats
Python), _ruff_ (Python linter: flags suspicious patterns), _mypy_ (checks
type annotations), _eslint_ (JavaScript linter) and _prettier_ (JS/docs
formatter) — all clean; full API suite still 673 passed, 92.92% coverage.

**WHICH files** (in `/Users/macbook/Blen/agency-intelligence-wt/feat-18-entra-workload-identity`):
`apps/api/app/helpers/federation.py` and
`apps/api/app/api/use_cases/routes.py` (the renames).

**WHY:** A credential system for a government gateway earns a dedicated
adversarial pass — reviewing _for attacks_ (forged tokens, secrets in logs,
enumeration oracles) is a different lens than reviewing _for correctness_,
and doing it before commit is far cheaper than after deploy. The renames
matter because inconsistent names are where bugs hide: if half the code
says "workload" and half says "federated", a future search for one term
silently misses the other half.

## 2026-08-18 — #18 shipped: commit + PR #91

**WHAT changed:** Committed the ticket #18 work and opened the pull request
(a _pull request_, or PR, is a proposal on GitHub asking to merge one
branch's commits into another, where reviewers and automated checks gate
the merge): https://github.com/blencorp/agency-intelligence/pull/91,
branch `feat/18-entra-workload-identity` → `main`, single commit `e9aae80`.
Two mechanical lessons: (1) _commitlint_ (a tool that rejects commit
messages not matching the team's format) refused the first message because
its subject started with a capitalized proper noun ("Entra ID…") — the
`subject-case` rule reads that as sentence-case; starting with a lowercase
verb ("add Entra ID…") passes. (2) The repo's PR template is parsed by a CI
job, so the Lifecycle/Risk/date lines were filled as single bare values
(`proposal`, `low`, `2026-11-18`) with all eight checkboxes kept verbatim.

**WHICH files:** No source edits this session — `git commit` and `git push`
in `/Users/macbook/Blen/agency-intelligence-wt/feat-18-entra-workload-identity`,
plus the PR body draft in the session scratchpad.

**WHY:** Kyle reviewed the branch and approved shipping. The PR body pastes
the real verification output (verify + contracts both exit 0; API 673
tests / 92.92% coverage) because the repo's rule is evidence before claims —
a reviewer should never have to take "it passes" on faith.

## 2026-08-18 — Acting as reviewer: security pass on PR #91

**WHAT:** Reviewed pull request #91 in `blencorp/agency-intelligence` (the
workload-identity federation change journaled above) and posted the review
on GitHub: a summary plus six _inline comments_ (remarks attached to
specific lines of the changed code, so the discussion sits next to the
code it concerns). Verdict: no secrets exposed, no exploitable
vulnerability, guardrails followed — but three cheap _defense-in-depth_
fixes (extra safety layers, so no single mistake becomes fatal) were asked
for before merge: (1) pin the token-signature _algorithm_ (the exact math
used to create and verify a token's signature) instead of reusing the
Clerk app's setting, so one config knob no longer controls two unrelated
login systems; (2) pin the expected _issuer_ (the `iss` field inside a
token that names which authority created it), which the code currently
never checks against configuration; (3) require `https://` for the _JWKS_
URL (JSON Web Key Set — a published list of public keys used to verify
token signatures), because fetching those keys over plain HTTP would let
an attacker sitting on the network swap in their own keys and forge tokens
the platform would accept. Three minor notes too: slow-fetch timeout and
key-rotation lag, one untested failure branch, and issuer format checking
at registration. The PR's test claims were verified independently by
running its 24 new tests locally at the exact reviewed commit — all
passed. A deeper automated correctness review was also launched and will
post its own comments when done.

**WHICH files:** No source edits this session — review work only. The
review was posted through the GitHub API from two scratchpad files
(`pr91.diff`, the downloaded change set; `pr91-review.json`, the review
payload). Review link:
https://github.com/blencorp/agency-intelligence/pull/91#pullrequestreview-4964470564

**WHY:** Kyle asked for a reviewer pass on PR #91 treating it as a
government gateway: confirm guardrails, no secret or API-key exposure, no
vulnerabilities, and clean hygiene. GitHub only allows a "comment"-type
review on one's own PR (not approve/request-changes), but writing the
security reasoning down next to the code before merging is the point:
evidence and objections belong on the record, not in someone's head.

## 2026-08-18 — Un-reviewing PR #91: removing everything that was posted

**WHAT:** Kyle revoked posting permission ("remove all comments left on PR,
do not comment unless approved to"), so everything published in the
previous entry was taken back down. All six _inline comments_ (remarks
attached to specific lines of changed code) were deleted through the
_GitHub API_ (a way for programs to read and change things on GitHub by
sending requests, instead of clicking in the browser). One limit
discovered: GitHub will not let you delete a _submitted review_ itself —
only its comments and its text — so the review record remains as an empty
shell whose body now reads "(removed)". The still-running automated review
pipeline was also shut down before it could post anything: its worker
_subagents_ (helper programs launched to work on pieces of a bigger job)
were stopped — one auto-restarted and had to be stopped twice — and the
coordinator was sent an explicit abort message revoking its permission to
comment. Afterwards the PR was re-checked: zero comments remain. The
security findings themselves (pin the signature algorithm, pin the
expected issuer, require HTTPS for the key-set URL, plus three minor
notes) still live in the conversation and the previous journal entry.

**WHICH files:** No project source files changed. The deletions happened
on GitHub (PR #91 in `blencorp/agency-intelligence`) via `gh api` calls.
One new personal-memory rule was saved outside the repo at
`~/.claude/projects/-Users-macbook-note2action/memory/no-unapproved-pr-comments.md`
(plus its index line in `MEMORY.md` there) so the lesson persists across
sessions.

**WHY:** Publishing a review is an outward-facing action: once comments
are on a shared PR, teammates can read them and GitHub keeps traces even
after deletion (the "(removed)" stub proves it). The durable rule going
forward: findings are presented in chat first, and nothing gets posted to
a PR or issue without Kyle's explicit approval for that specific posting.

## 2026-08-18 — #26 built: gateway exact-match response cache (Redis)

**WHAT changed:** Implemented ticket #26 for agency-intelligence: the AI
gateway now has a _response cache_ — it remembers the answer to a request
and serves the identical request again from memory instead of paying for a
second model call. The store is _Redis_ (a fast in-memory key-value
database). "Exact-match" means the lookup key is a _hash_ (a short
fingerprint computed from data; any change produces a different
fingerprint) of the caller's entire request in _canonical JSON_ — the JSON
re-written with keys sorted so that `{"a":1,"b":2}` and `{"b":2,"a":1}`
fingerprint identically. Entries are private to one use case +
classification by default; sharing across use cases requires both the
lowest classification and an explicit opt-in flag; requests labeled `phi`
(protected health information) are never cached unless a deploy
explicitly enables it. Everything _fails open_: if Redis is down the
request just goes to the model as a normal miss — a cache may never break
a request. Second identical request within the _TTL_ (time-to-live: how
long an entry survives) returns with header `x-ai-cache: hit`.

**WHICH files** (in `/Users/macbook/Blen/agency-intelligence-wt/feat-26-gateway-response-cache`):

- `apps/api/app/helpers/response_cache.py` — new: key normalization, scope
  rules, fail-open Redis wrapper.
- `apps/api/app/api/v1/routes.py` — cache lookup before the upstream call,
  store after; new `x-ai-data-labels` header parse; threaded the real
  hit/miss status into the response header and usage ledger.
- `apps/api/app/core/config.py`, `.env.example`, `docker-compose.yml` —
  three new settings (blank Redis URL = cache off in dev) and a dev Redis
  service.
- `apps/api/pyproject.toml`, `apps/api/uv.lock` — `redis` runtime dep,
  `fakeredis` (an in-process Redis imitation with real command semantics)
  for tests.
- Tests written first (watched fail, then green):
  `apps/api/tests/test_response_cache_unit.py` and
  `test_response_cache_gateway.py` — 27 cases covering all three
  acceptance criteria plus streaming bypass and Redis-outage fail-open.
- `docs/plans/2026-08-18-26-gateway-response-cache.md` — the plan.

**WHY:** The provider's prompt cache only discounts a repeated prompt
_prefix_; it cannot capture the whole-request repeats that dashboards and
retry storms generate. A gateway-side cache serves those for free. The
subtle ordering bug avoided: prompt shaping injects a per-request cache
hint into the payload, so the cache key must be computed from the raw
payload _before_ shaping — keying after shaping would make every request
unique and the hit rate permanently zero. Placement detail: the new
settings went in a region of config.py far from where open PR #91 inserts
its settings, so git can merge both PRs cleanly in either order.

## 2026-08-18 — #26 verified end to end; awaiting ship decision

**WHAT changed:** Closed out the #26 build with final polish and fresh
verification. Fixed a stale code comment (the cache-status constant still
claimed "caching is out of scope" from the earlier ticket that stubbed
it), reverted an accidental `bun.lock` change (a _lockfile_ — the exact
recorded versions of every installed package — that the installer had
rewritten as a side effect), regenerated `apps/api/uv.lock` (the Python
equivalent) to include the new `redis` and `fakeredis` packages, and
silenced the two linter/type-checker findings (an unused import; a byte
type mismatch fixed with an explicit `bytes()` conversion). Then re-ran
the entire verification gate against the finished tree — because the
first run had overlapped my last edits, and evidence should describe the
final state, not a moving one: verify exit 0, contracts exit 0, API 676
tests passed at 92.92% coverage, all 27 new cache tests shown passing
name by name.

**WHICH files** (in `/Users/macbook/Blen/agency-intelligence-wt/feat-26-gateway-response-cache`):
`apps/api/app/api/v1/routes.py` (comment + `bytes()` fix),
`apps/api/tests/test_response_cache_unit.py` (unused import),
`apps/api/uv.lock` (regenerated), `bun.lock` (reverted, no net change).

**WHY:** A verification run that raced concurrent edits proves nothing
about the tree you actually ship — re-running on the final state is the
cheap way to make "it passes" a fact instead of a guess. Work is
uncommitted, waiting on Kyle's commit/PR decision. Also observed (and
deliberately left alone): someone is mid-edit on the #18 worktree adding
issuer pinning; its helper doesn't enforce the pinned issuer yet.

## 2026-08-18 — Hardening the federation auth path (PR #91 review fixes)

**WHAT:** Applied the three security fixes from the earlier review to the
PR #91 branch, using _TDD_ (test-driven development — write a test that
fails because the behavior doesn't exist yet, watch it fail, then write
just enough code to make it pass; the watched failure proves the test can
actually catch the bug). Nine new tests were written first and each failed
for the expected reason before any code changed. The fixes: (1) the
federation token check now uses its own pinned _algorithm_ list of
`RS256` (the algorithm is the exact math used to create and verify a
token's signature) instead of borrowing the Clerk login system's setting —
before, flipping that one shared knob silently changed which Entra tokens
were accepted, and a test proved it by failing with
`InvalidAlgorithmError`; (2) a new `ENTRA_FEDERATION_ISSUER` setting pins
the expected _issuer_ (the `iss` field inside a token naming which
authority created it) so verification compares it against configuration
instead of trusting whatever the token claims, and federation now refuses
to run (a clear 503 "service unavailable" response) unless all three of
its settings are present; (3) a _validator_ (a small function that runs
when configuration loads and rejects bad values) forces the _JWKS_ URL
(JSON Web Key Set — the published list of public keys used to check token
signatures) to use `https://`, because keys fetched over plain HTTP could
be swapped by an attacker on the network; loopback addresses like
`127.0.0.1` stay allowed so the test suite's local stub server keeps
working.

**WHICH files:** In
`/Users/macbook/Blen/agency-intelligence-wt/feat-18-entra-workload-identity/`:
`apps/api/app/helpers/federation.py` (pinned algorithms, issuer check,
three-setting requirement), `apps/api/app/core/config.py` (new issuer
setting + HTTPS validator), `apps/api/tests/test_federation_config.py`
(new — 6 config tests), `apps/api/tests/test_federated_stub_idp.py`
(3 new behavior tests + fixture/helper updates), `.env.example`,
`docs/authentication.md`, and
`docs/plans/2026-08-18-18-entra-workload-identity-federation.md`
(addendum). Changes are uncommitted, pending Kyle's approval to commit
and push.

**WHY:** Kyle approved exactly these three fixes from the security
review. Each one is _defense in depth_ (layered safety so no single
mistake is fatal): the algorithm and issuer pins remove trust the code
was silently extending, and the HTTPS rule makes a dangerous
misconfiguration impossible instead of merely unlikely. Verified with
real output before claiming success: full API suite 682 passed /
coverage 92.95%, lint and type checks clean, all contract checks passed.

## 2026-08-18 — Shipping the hardening: commit ee0f38d + PR #91 update

**WHAT:** With Kyle's approval, the three security fixes from the previous
entry were committed and pushed, and PR #91's description was brought up
to date. Before committing, the full _verify gate_ (the repo's single
command that runs every lint, type check, test suite, and contract check
in one go — `bun run verify`) was re-run and exited 0 (an _exit code_ of
0 is a program's way of saying "success"; anything else means failure).
The commit message subject starts with a lowercase verb ("harden…")
because the repo's _commitlint_ tool (which rejects commit messages that
don't match the team's format) reads a capitalized first word as
sentence-case and refuses it. The PR body's evidence block was updated to
the real post-fix numbers (682 API tests passed, 92.95% coverage, 33 new
tests) while the template lines that a CI job parses — Lifecycle state,
Risk level, review date, all eight checkboxes — were left byte-identical;
that "accountability" check passed on the edited body. A _monitor_ (a
small background watcher that reports when something changes) is watching
the remaining CI checks on the new commit.

**WHICH files:** In the worktree
`/Users/macbook/Blen/agency-intelligence-wt/feat-18-entra-workload-identity/`:
no new source edits this session — `git add` + `git commit` (`ee0f38d`)
of the seven files from the previous entry, then `git push` to
`origin/feat/18-entra-workload-identity`. The updated PR description was
drafted in the session scratchpad (`pr91-body.md`) and applied with
`gh pr edit 91`.

**WHY:** Kyle said "commit and update pr". The repo's rule is evidence
before claims: the PR must paste real verification output, so the gate
was re-run _after_ the hardening commit and the pasted numbers come from
that run — a reviewer should never inherit stale evidence from an
earlier version of the branch.

## 2026-08-18 — #26 security review found and fixed a scope-forgery bug

**WHAT changed:** Adversarial review of the #26 cache branch (treating it
as a government gateway) found one real defect in my own uncommitted code:
_delimiter injection_ into the cache scope. The scope string joined
caller-supplied values with `:` — so a use-case id that itself contained a
colon (like `a:cui`) could produce the same scope string as a different
use-case + classification pair, letting two different security contexts
share cache entries. The fix _percent-encodes_ each component (URL-style
escaping, where `:` becomes `%3A`) before joining, so the delimiter can
never be forged. Done TDD: the collision test was written first and
watched fail, then the fix turned it green. Also renamed the route helper
`_cache_store` → `_store_response` for verb-first naming consistency, and
re-ran the full hygiene chain: black (no-op), ruff clean, mypy clean,
eslint clean (web + mobile), prettier clean, 677 API tests at 92.93%
coverage.

**WHICH files** (in `/Users/macbook/Blen/agency-intelligence-wt/feat-26-gateway-response-cache`):
`apps/api/app/helpers/response_cache.py` (the quote() fix),
`apps/api/tests/test_response_cache_unit.py` (the collision test),
`apps/api/app/api/v1/routes.py` (rename).

**WHY:** Joining untrusted strings with a delimiter is the classic way
scoping schemes break — the same bug family as log injection and path
traversal. The security review lens ("how would I forge this key?")
caught what the functional tests could not, because every functional test
used well-behaved ids. Per Kyle's instruction, nothing was committed or
pushed — results handed over in chat.

## 2026-08-18 — Module 10 begins: the full ActionItem contract, both languages

**WHAT changed:** Started Module 10 (connecting the web app to the real
database) with steps 1–3: the _wire contract_ — the agreed JSON shape that
travels between apps — grew from the three-field stub `{id, title, done}`
to the full eleven-field `ActionItem` that mirrors the `action_items`
table. I typed the schema twice, once per language: a _zod_ schema in
`packages/shared` (TypeScript, guards the web side) and a _pydantic_ model
in the API (Python, guards the server side). New tools learned:
`.nullable()` in zod and `str | None` in Python both mean "a value or
null" — the ER diagram's nullable columns arriving on the wire;
`Literal["High", ...]` is Python's version of `z.enum` (only these exact
strings allowed); `.isoformat()` asks a Python date to write itself as a
`"2026-08-18"` string, because dates travel as strings in JSON. Then the
repository learned to speak the full shape: the Postgres translation now
maps all eleven columns (snake_case DB names on the right, camelCase wire
names on the left), and the in-memory fake's seeds became full items that
obey the same rules as the real database.

**WHICH files:** `packages/shared/src/index.ts` (`Status` enum +
`ActionItem` zod schema), `apps/api/app/schemas.py` (Literal enums,
`ActionItem` model, `ItemsResponse` now carries it; stub `Item` deleted),
`apps/api/app/repository.py` (Protocol + both repositories upgraded; the
import alias `from .models import ActionItem as ActionItemRow` keeps the
database class and the wire class apart), `apps/api/tests/test_items.py`
(asserts integer ids and the full key set).

**WHY:** The web app can't display owners, due dates, and priorities that
the repository throws away — and both ends of the wire must agree on the
shape character-for-character, or good rows get rejected as garbage. My
mentor's review caught exactly that: my zod enum said "In Progress" but
the database constraint says "In progress" — one capital letter that
would have broken every in-progress item. Proof that the contract works:
feeding pydantic that same typo now raises a ValidationError naming the
field. Debugging lessons this session: a traceback prints source lines
from the file on disk _right now_, not from the code the process is
actually running — so a "fixed" line can appear in a stale server's
error (running code ≠ disk code); and `Connection refused` means "the
thing you're calling isn't running" (my Postgres container hadn't
survived the day change — `docker compose up -d postgres` brought it
back, and the named volume still had my row). Final proof: pytest green
on the in-memory fake, then curl returned my survivor row wearing all
eleven fields with correct types.

## 2026-08-18 — Steps 1–3 committed; mentor cleanup pass before the commit

**WHAT changed:** My mentor did a small cleanup pass on my step 1–3 work
and then committed it all as `fee23be` (a _commit_ is a saved snapshot of
the project in git with a message describing it). The cleanups: the old
stub `Item` class was deleted from the API's schemas — _dead code_ (code
nothing calls anymore) that survived my sweep; before deleting we ran a
word-exact `grep` (a search tool that finds text in files) to prove
nothing still referenced it. The items test was renamed from
`test_list_items_returns_stub_items` to
`test_list_items_returns_full_action_items` so its name matches what it
now proves, and `meetingId` was added to the test's key-set check — my
list of expected fields had ten entries where the schema has eleven, so
one field was going unchecked.

**WHICH files:** `apps/api/app/schemas.py` (stub `Item` removed),
`apps/api/tests/test_items.py` (rename + `meetingId` in the asserted key
set), `memory.md` (the journal entry above this one). Committed together
with my step 1–3 work in `packages/shared/src/index.ts` and
`apps/api/app/repository.py`.

**WHY:** A commit is a shipped unit — dead code and stale test names
inside it become permanent history someone else reads later. The
one-field gap in the test mattered more than it looks: a _subset
assertion_ (checking "at least these keys exist") only guards the keys
you actually list, so a missing `meetingId` in a response would have
passed the test silently. Tests were re-run after the cleanups
(`2 passed`) before committing, because evidence comes before claims.

## 2026-08-18 — Fixed the nagging Stop hook: a shared-state race

**WHAT changed:** The repo's journal-enforcing _Stop hook_ (a small
script Claude Code runs automatically every time the assistant finishes
a turn) was blocking every prompt with "you edited files but haven't
journaled" even when nothing in this repo changed. Root cause: the hook
pair used one shared _flag file_ (an empty file whose mere existence is
the signal) at `.claude/.memory_pending` — any file edit created it, and
the Stop hook demanded a journal entry whenever it existed. But several
Claude sessions now run in parallel under this project, and they all
touched the _same_ flag — so session B's edits made the hook nag session
A. That's a _race condition_ on _shared state_: multiple writers to one
signal, with no way to tell whose it is. Two fixes: (1) the flag is now
per-session — each session writes `.memory_pending_<session id>` (the
_session id_ is the unique name Claude Code gives each running
conversation) and the Stop hook only checks its own; (2) edits to files
_outside_ this repository no longer set the flag at all, so work on
other projects can't trigger note2action's journal rule. Also added a
self-cleanup (flags older than two days are deleted) and widened the
`.gitignore` pattern to `.memory_pending*` (the `*` is a _glob_ — a
wildcard matching any ending) so the new flag names never show up as
untracked files.

**WHICH files:** `.claude/settings.json` (the PostToolUse and Stop hook
commands) and `.gitignore` (line 28's pattern).

**WHY:** A hook that cries wolf trains everyone to ignore it — the
journal rule only works if a block really means "you have unjournaled
edits." The fix was verified before being trusted: each hook command was
tested by piping fake inputs through it (in-repo edit → flag appears;
out-of-repo edit → no flag; memory.md edit → no flag; stop with pending
flag → block; stop again → silent; journal-after-edit → silent), and the
settings file was re-validated as proper JSON afterwards. Sessions that
were already running keep the old hook wording until they restart, so
the last few `.memory_pending`-style nags may linger in _other_ open
sessions but not new ones.

## 2026-08-18 — Roles flipped; PATCH /api/items/{id} finished (Claude implements, Kyle reviews)

**WHAT changed:** The course workflow reversed — from now on the mentor
writes the code and Kyle reviews each change before the next step. First
implementation under the new rules: finishing the PATCH endpoint (an
_endpoint_ is one URL the API answers on; _PATCH_ is the HTTP verb for
"change only these fields"). Four pieces: (1) `ActionItem` in the API's
schemas went back to strict — every field required again — and the
partial-update shape became its own class, `ActionItemPatch`, where every
field is optional; the two answer different questions ("what does a
complete item look like?" vs "what may a client change?"), and making the
main schema optional would have let broken rows pass validation silently.
(2) The PATCH route got `response_model=ActionItem` to match the other
routes' style (Kyle had already added the missing imports himself).
(3) The repository _Protocol_ (the promise-list every implementation must
honor) gained `update_item`, and the in-memory fake implemented it using
`model_copy(update=...)` (pydantic's "copy this object with these fields
changed") — including the server-side rule that `completed` is stamped
with today's date when status becomes "Done" and cleared otherwise.
(4) Two new endpoint tests: marking an item Done must return a
`completed` date the client never sent (and reverting must clear it),
and patching an unknown id must return _404_ (the "not found" status
code) with a clean message instead of a crash.

**WHICH files:** `apps/api/app/schemas.py` (strict `ActionItem` +
new `ActionItemPatch`), `apps/api/app/main.py` (`response_model`),
`apps/api/app/repository.py` (Protocol method, in-memory `update_item`,
docstring updated to describe the two-implementation reality),
`apps/api/tests/test_items.py` (two PATCH tests).

**WHY:** Kyle asked to flip roles: "you implement the code and I will
review your changes." Verified before presenting: `uv run pytest` shows
5 passed, and against the live server curl PATCH marked the real row
Done (server stamped `completed: "2026-08-18"`), returned
`{"detail":"Item not found"}` for id 999, and a final revert left the
demo row back at "Not started" with `completed: null`.

## 2026-08-18 — Step 4b: DELETE /api/items/{id}, and tests stop sharing state

**WHAT changed:** The API can now delete an item. The repository
_Protocol_ gained `delete_item(item_id) -> bool` (True = deleted, False
= no such id — the repository reports facts; the endpoint decides what
they mean over HTTP). Both implementations honor it: the in-memory fake
removes the item from its list; the Postgres one loads the row by
primary key, `session.delete(row)` marks it for removal, and
`session.commit()` makes it real. The endpoint returns _204 No
Content_ — the HTTP status for "done, and there is nothing to say
back" — so it sends an empty body on success and 404 for unknown ids.
Alongside, the test file got a structural fix: a _pytest fixture_ (a
setup function pytest runs around tests) marked `autouse` (runs before
every test automatically) now gives each test its **own** fresh
in-memory repository. Before, all tests shared one module-level fake, so
a delete test would have shrunk the list a later test counts — an
_order dependence_ bug where tests pass or fail depending on which runs
first.

**WHICH files:** `apps/api/app/repository.py` (Protocol + both
`delete_item` implementations), `apps/api/app/main.py` (the DELETE
route), `apps/api/tests/test_items.py` (autouse fixture + two DELETE
tests).

**WHY:** DELETE is in the Module 8 API contract. Verified: 7 tests
pass; live proof planted a sacrificial row directly in Postgres (id 3),
deleted it through the API (204, empty body), got 404 on the second
attempt, and the list still shows only the survivor row — the demo data
was deliberately spared.

## 2026-08-18 — Step 4c: POST /api/meetings — captures become durable

**WHAT changed:** The biggest endpoint yet: one POST persists a whole
capture — the meeting and every extracted item — in a single
_transaction_ (an all-or-nothing unit of database work: either the
meeting AND all its items are saved, or none are). New wire schemas in
both languages: `Meeting` (`{id, title, capturedAt, itemCount}` —
itemCount is derived by counting, never stored), `CreateMeetingRequest`
(`{title, rawNotes, items: ExtractedItem[]}`), `CreateMeetingResponse`,
plus a Python mirror of `ExtractedItem` (the AI's output shape, which
the API never needed to understand until now). The Postgres
implementation taught a new session tool: `session.flush()` sends the
INSERT so Postgres assigns the meeting's id — needed as the foreign key
on each item row — but keeps the transaction open; nothing is durable
until `commit()`. Flush = "show me the ids"; commit = "ink it". Also:
the extractor uses `""` to mean "no due date / no note", but the
database uses NULL — the repository translates (`item.due or None`) at
the border, per the frontend-''-to-DB-NULL decision in the docs. New
items are born with the api-design.md defaults: status "Not started",
saved false, completed null. The shared per-test fixture moved to
`tests/conftest.py` — a file pytest loads automatically for every test
file — so the new meetings tests get the same fresh-fake isolation.

**WHICH files:** `packages/shared/src/index.ts` (Meeting,
CreateMeetingRequest, CreateMeetingResponse), `apps/api/app/schemas.py`
(same four shapes), `apps/api/app/repository.py` (Protocol method, both
implementations, `_new_item` birth-defaults helper),
`apps/api/app/main.py` (the 201 route), `apps/api/tests/conftest.py`
(new), `apps/api/tests/test_items.py` (fixture moved out),
`apps/api/tests/test_meetings.py` (new — happy path incl. ''→null and
birth defaults, plus 422).

**WHY:** "Persist at extraction" is the Module 8 decision this endpoint
enacts — Review items must already be rows for the saved workflow to
work. Verified: 9 tests pass; live curl POSTed a two-item capture
(201; meeting id 2, items 4-5; '' arrived as null in Postgres), psql
showed the rows, and cleanup deleted the meeting — its items vanished
with it, the `ondelete=CASCADE` rule doing its job — leaving only the
survivor row.

## 2026-08-18 — Module 10 step 4 finished: meetings GETs, save-to-tasks, and `meeting` on the wire

**WHAT changed:** The API grew its last three Module 10 endpoints.
`GET /api/meetings` returns recent captures newest-first with a `?limit`
(default 3) for the Capture screen's RECENT strip — each with an
`itemCount` that is _derived_ (computed by COUNTing the meeting's items
at read time, never stored, so it can't drift). `GET /api/meetings/{id}`
returns one full capture including the transcript, or 404.
`POST /api/items/save-to-tasks` is the "Save N to Tasks" button as one
_batch_ update — a single SQL `UPDATE ... WHERE saved = false AND
status != 'Done'` that returns `{updated: N}`; one call can't partially
fail the way N separate calls can. Also a contract change: every wire
item now carries `meeting` — the meeting's _title_ — which the API joins
in (a SQL JOIN pairs each item row with its meeting row) because the
Review cards display it; the alternative was every client re-fetching
the meetings list just to label cards. And one latent bug fixed:
PATCHing a due date handed SQLAlchemy a "YYYY-MM-DD" _string_ where the
column needs a Python `date` — the repository now converts at the
border, the same place every other translation lives.

**WHICH files:** `packages/shared/src/index.ts` (meeting field,
ActionItemPatch + confidence, MeetingsResponse, MeetingDetail,
SaveToTasksResponse; stub `Item` deleted), `apps/api/app/schemas.py`
(same shapes), `apps/api/app/repository.py` (three Protocol methods ×
two implementations; `to_wire` takes the meeting title; in-memory
meetings became internal records with derived counts),
`apps/api/app/main.py` (three routes), tests (meetings list/detail/404,
save-to-tasks batch + no-op), `docs/api-design.md` (the `meeting`
decision recorded).

**WHY:** These are the last endpoints the Module 8 contract promised
for Module 10. Verified: 13 API tests pass; live curls showed the
meetings list, the transcript detail, items wearing their meeting
title, and save-to-tasks returning `{"updated": 1}` (then reverted so
the demo row stays pending).

## 2026-08-18 — Module 10 steps 5-6: the web app talks to the database

**WHAT changed:** The web app stopped being a beautiful liar. Before:
every item lived in a _zustand_ store (client-side state kept in the
browser tab) seeded from hardcoded constants — refresh the tab and
everything reset. Now: items and meetings are _server state_, fetched
from the API and cached by TanStack Query. A _query_ reads and caches
(`useQuery(["items"])`); a _mutation_ changes data on the server and
then _invalidates_ the cache — marks it stale so every view refetches
fresh truth instead of trusting a local copy. New files:
`lib/items.api.ts` and `lib/meetings.api.ts` (typed fetch functions per
endpoint, zod-validated) and `lib/items.queries.ts` (the query/mutation
hooks). Every user action became an API call: edit a field → PATCH
(text fields save on _blur_ — when you leave the field — so typing
doesn't fire a request per keystroke); Confirm → PATCH confidence 100;
Discard → DELETE; Save N to Tasks → the batch endpoint; status changes
and Reopen → PATCH; extraction → the AI app, then POST /api/meetings so
the capture is rows _before_ Review ever shows it. The RECENT strip and
transcript modal now show real captures from the API instead of
hardcoded fakes. The store went on the Module 10 diet: it now holds
ONLY client state — the capture draft, sample rotation, which modal is
open, extraction-in-flight — and the seed items and fake RECENTS
constants were deleted. One deliberate behavior change: re-extracting
used to _replace_ the pending Review batch (a mock-era artifact); with
persist-at-extraction each capture _adds_ its items, so Review
accumulates until items are saved or discarded.

**WHICH files:** new `apps/web/src/lib/items.api.ts`,
`lib/meetings.api.ts`, `lib/items.queries.ts`; rewritten
`store/actionItems.store.ts` (client-only) and
`store/actionItems.types.ts` (view-model derived from the shared wire
type — inputs can't hold null, so "" ↔ null translates in items.api.ts,
the client's twin of the API's `to_wire`); `lib/http.ts` (204-no-body
fix); `providers.tsx` (queryClient exported); views review/tasks/
history/home; components review-card, task-row, history-row,
sidebar-nav, completion-card, recent-captures, recent-modal;
`lib/dates.ts` (timeAgo); `test/fixtures.ts`;
`store/actionItems.constants.ts` (seeds/RECENTS removed).

**WHY:** Module 10's whole point: after this, the browser is a _view_
of the database, not the database. Verified: web typecheck clean, all
33 web tests pass, production build succeeds, API suite 13 passed. The
browser checkpoint (save items → hard refresh → still there → restart
the stack → still there) is queued for Kyle's manual pass — it needs
the API on port 8000, where the Vite proxy points.

## 2026-08-19 — note2action's API officially moves to port 8001

**WHAT changed:** The checkpoint instructions failed for two reasons.
First, the instruction `lsof ... → kill <PIDs>` was prose typed into the
shell — the arrow and the `<PIDs>` _placeholder_ (a stand-in you're
meant to replace with a real value) aren't valid zsh, hence
`parse error near '\n'`. Lesson: commands for the terminal must be
copy-pasteable exactly as written. Second and more important: port 8000
turned out to belong to a _different project_ — the hoops-tracker API
(`fastapi dev --port 8000`) running on this machine — so "kill the 8000
squatter" was the wrong plan entirely; that server is doing its job for
another repo. The durable fix: note2action's API officially claims
**8001** (where it has been running all module anyway). Changed the
`dev:api` script, the Vite proxy default (`vite.config.ts`), the
Docker port mapping (host 8001 → container 8000; inside the Compose
network nothing changes), and swept every doc that said 8000.

**WHICH files:** `package.json` (dev:api → 8001),
`apps/web/vite.config.ts` (proxy default), `docker-compose.yml`
(host mapping "8001:8000"), `README.md`, `docs/roadmap.md`,
`docs/course/README.md` (Postman baseUrl), `docs/architecture/
overview.md` and `web.md`.

**WHY:** Two projects on one laptop can't share a port — a port is a
parking spot, one car only. Verified end to end through the browser's
actual route: started the Vite dev server and curled _through the
proxy_ — `localhost:5173/api/health`, `/api/items`, and `/api/meetings`
all returned live Postgres data. The web server was left running for
the manual checkpoint.

## 2026-08-19 — "Extraction failed" diagnosed: the AI app wasn't running

**WHAT changed:** The Extract button showed "Extraction failed". The
extraction flow now has two legs — leg 1 calls the AI app (port 3000)
to turn notes into items; leg 2 POSTs the capture to the API (port 8001) so it becomes database rows — and the store's catch block shows
one generic message for either leg failing. Diagnosis by testing each
leg directly with curl through the Vite proxy (the browser's exact
route): leg 1's port had _nothing listening_ — the AI app was simply
never started. Started it (`pnpm --filter @note2action/ai dev`,
left running), re-tested leg 1 (real extraction came back, "Friday"
correctly inferred as 2026-08-22), then proved leg 2 with a debug
capture (201, rows created) and deleted it again via psql — the
CASCADE rule removing its item. One hardening from the lesson: the
Capture screen's error line now shows the _actual_ error message
(which names the failing URL and HTTP status) instead of a fixed
sentence that always blamed the AI app.

**WHICH files:** `apps/web/src/components/app/notes-editor.tsx` (the
error line). Everything else was investigation and process
management, not code.

**WHY:** A fixed error message that guesses at the cause sends the
next debugger in the wrong direction — surfacing the real failure
(`POST /ai-api/extract failed (HTTP 500)` vs `POST /api/meetings
failed…`) names the broken leg for free. Web typecheck re-verified
clean after the copy change.

## 2026-08-19 — History stat: "across N meetings" derived, not hardcoded

**WHAT changed:** The History view's "Completed all time" tile said
"across 4 meetings" — a number typed into the code back in the mock
era, wrong the moment real data arrived. Now N is derived from the
meetings actually in the database: `useMeetingsQuery` accepts a
`limit` (the RECENT strip keeps its 3; History asks for up to 1000 —
a stand-in for "all" until the API needs real paging), the view
passes `meetings.length` into `historyStats`, and the label
pluralizes ("across 1 meeting" vs "across 3 meetings"). A new test
pins both the derivation and the pluralization.

**WHICH files:** `apps/web/src/lib/items.queries.ts` (limit param,
limit in the query key so different limits cache separately),
`views/history/history.utils.ts` (`historyStats` takes
`meetingCount`), `views/history/history.view.tsx` (fetch + thread the
count), `views/history/history.utils.test.ts` (updated signatures +
new pluralization test).

**WHY:** Hardcoded display numbers are lies waiting to be noticed —
Kyle spotted this one reviewing the running app. Verified: typecheck
clean, 34 web tests pass.

## 2026-08-19 — New Meetings screen: every saved capture, one click to its transcript

**WHAT changed:** A sixth screen. `/meetings` lists every capture in
the database as full-width cards, newest first — title, "N items
extracted", and a relative "Nd ago" — with the app's standard entrance
animation and hover treatment (the existing `n2a-row` and `recent-btn`
CSS classes, reused rather than reinvented). Clicking a card opens the
_same_ transcript modal the Capture screen's RECENT strip uses: the
modal lives in the app layout (so it can open from any route) and is
driven by one store value, `modalMeetingId` — the new screen just calls
the existing `openRecent(id)` action, and everything else (fetching the
transcript, "Load into capture") came for free. Data comes from
`useMeetingsQuery(1000)` — all meetings, not the strip's three. Loading
and no-meetings-yet states use the shared `EmptyState`.

**WHICH files:** new `apps/web/src/views/meetings/meetings.view.tsx`
(single-file view — no local UI state or derivations, so no
`.store.ts`/`.utils.ts` needed); `App.tsx` (route);
`components/app/sidebar-nav.tsx` (nav entry after History).

**WHY:** Kyle asked for it — the RECENT strip only shows three
captures, and older ones had no home. The reuse is the lesson: because
the modal was already global and id-driven, a whole new screen needed
zero new modal code. Verified: typecheck clean, 34 web tests pass,
production build succeeds.

## 2026-08-19 — Meetings cards: hover swaps "1d ago" for the real date

**WHAT changed:** On the Meetings screen, hovering a card's relative
timestamp ("1d ago") now cross-fades it into the actual capture date
("Aug 18"). The implementation dodges a classic CSS trap: if the
element you're hovering _hides itself_, the hover ends the instant it
disappears — which un-hides it, re-triggers the hover, and flickers
forever. The fix: both labels are stacked in the same CSS grid cell
(`col-start-1 row-start-1` twice), so the wrapper keeps the width of
the wider label and the cursor never loses its target; hover state
lives on the wrapper (a named Tailwind group, `group/when`) and only
the labels' opacity changes. The date label carries
`aria-hidden` so screen readers hear one timestamp, not two.

**WHICH files:** `apps/web/src/views/meetings/meetings.view.tsx`
(the timestamp span), `lib/dates.ts` untouched — `formatDate` already
existed and takes the ISO timestamp's first ten characters.

**WHY:** Kyle asked for it. Relative time is instantly readable but
imprecise; the hover gives the precise date without spending
permanent space on it. Verified: typecheck clean, 34 web tests pass.

## 2026-08-19 — Tasks view: priority filter joins owner and status

**WHAT changed:** The Tasks screen's toolbar has a third dropdown:
priority (All/High/Medium/Low), composing with the existing owner and
status filters — every active filter must match (a logical AND). The
change walks the view's three files in order: `tasks.store.ts` (the
view-local zustand store gains `filterPriority` + setter, and
`clearFilters` resets all three), `tasks.utils.ts` (`taskRows` takes
the new argument and adds one AND clause), `tasks.view.tsx` (a third
`FilterSelect`, reusing the same component as the other two). A
`PRIORITIES` constant joined `STATUSES` in actionItems.constants.ts —
the priority list was previously hardcoded inline in the Review card's
dropdown, so now there's one authoritative list to import.

**WHICH files:** `views/tasks/tasks.store.ts`, `tasks.utils.ts`,
`tasks.view.tsx`, `tasks.utils.test.ts` (signatures + a new
composition test), `store/actionItems.constants.ts` (PRIORITIES).

**WHY:** Kyle asked for it. Filters stay client-side per the Module 8
decision — the dataset is one user's items, small enough that a
round-trip per dropdown change buys nothing. Verified: typecheck
clean, 35 web tests pass.

## 2026-08-18 — #26 shipped: commit + PR with the new body format

**WHAT changed:** Committed the #26 response-cache work as `c7052a4`
(`feat(api): add FR-6 gateway exact-match response cache in Redis (#26)`),
pushed `feat/26-gateway-response-cache`, and opened the pull request —
this time with Kyle's new PR body layout: after the standard template
sections, the ticket's Acceptance Criteria and Test Criteria are listed
at the bottom under Observability, each mapped to the test that proves
it, plus an example request and response inside a `<details>` element (an
HTML tag GitHub renders as a collapsible dropdown, keeping big JSON
blocks out of the way until a reviewer clicks). Two durable preferences
were saved to long-term memory: the PR body format, and — reinforced
after an earlier incident today where a review was posted to PR #91
without approval — never comment on PRs or issues unless explicitly told
to. GitHub's API was intermittently unreachable (connection and TLS
handshake timeouts), so PR creation runs in a retry loop that first
checks whether the PR already exists — because a timeout can happen
_after_ the server created the PR, and blind retries would create
duplicates.

**WHICH files:** No source changes — `git commit`/`git push` in
`/Users/macbook/Blen/agency-intelligence-wt/feat-26-gateway-response-cache`,
the PR body draft in the session scratchpad, and two memory files in the
Claude memory directory.

**WHY:** Kyle approved shipping and specified the new PR format. The
check-then-retry pattern matters any time a network call is not
_idempotent_ (safe to repeat): "did my last attempt actually succeed?"
must be answered before trying again.

## 2026-08-18 — PR status audit: #91 fully pushed, #26 has in-flight follow-up

**WHAT changed:** No source edits — this was an investigation session
answering "what is uncommitted to PR #91?". Verified with git that the
answer is: nothing anymore. The hardening edits I had earlier seen
sitting in the #18 _worktree_ (a second checkout of the repo on its own
branch) as _uncommitted changes_ (edits saved to disk but not yet
recorded as a commit) were since committed by Kyle as `ee0f38d` and
pushed, so PR #91's remote branch matches the local one exactly —
`git status` empty, all 11 CI checks green. Lesson: a "worktree has
uncommitted changes" observation is a snapshot, not a fact that stays
true; re-verify before repeating it. Also surfaced the mirror-image
situation: the #26 worktree currently holds uncommitted security
follow-up (a production-only `rediss://` TLS validator, loopback-only
dev Redis, a new config test) that is NOT yet in PR #93.

**WHICH files:** none edited; read-only `git status` / `git log` /
`gh pr checks` in both worktrees under
`/Users/macbook/Blen/agency-intelligence-wt/`.

**WHY:** When someone asks "I thought we pushed everything?", the
trustworthy answer comes from comparing the local branch tip to the
remote one (`git log origin/<branch>`) and checking `git status` —
not from memory of what the tree looked like an hour ago.

## 2026-08-18 — Reviewing PR #93 (Redis response cache): two vulnerabilities fixed

**WHAT:** Reviewed PR #93 — a _response cache_ for the AI gateway (it
remembers answers to identical requests in _Redis_, an in-memory data
store, so repeat requests skip the expensive AI call) — with strict
instructions: post nothing to GitHub, fix only real vulnerabilities. Two
were found and fixed. First, the development _docker-compose_ file (a
recipe describing the containers a project runs locally) published Redis
on port 6379 to every network interface; Docker binds published ports to
`0.0.0.0` (meaning "all networks, not just this machine") and even
bypasses the host firewall, and this Redis has no password — so anyone on
the network could read cached AI responses or plant forged entries the
gateway would then serve to real callers (_cache poisoning_). Fix: bind
the port to `127.0.0.1` (loopback — reachable only from the machine
itself); containers still talk over their private network. Second, no
rule stopped a production deploy from using a plain `redis://` URL, which
moves cached government data and any password inside the URL unencrypted
across the network. Fix: a settings _validator_ (a function that rejects
bad configuration at startup) requiring `rediss://` (the TLS-encrypted
variant) when `API_ENV=production`, loopback exempt, dev unchanged —
written test-first (watched the rejection test fail before implementing).
Also reported without fixing: the cache's per-use-case isolation relies on
caller-supplied headers under one shared gateway key, so it is labeling
hygiene, not an enforced boundary, until per-use-case credentials arrive.

**WHICH files:** In
`/Users/macbook/Blen/agency-intelligence-wt/feat-26-gateway-response-cache/`:
`docker-compose.yml` (loopback bind), `apps/api/app/core/config.py`
(TLS validator), `apps/api/tests/test_response_cache_config.py` (new — 6
tests), `.env.example` (production note), and
`docs/plans/2026-08-18-26-gateway-response-cache.md` (addendum). All
uncommitted, awaiting Kyle's go-ahead.

**WHY:** Kyle asked for a government-gateway-grade review of PR #93 with
no PR comments and fixes only for actual vulnerabilities. Both fixes
close network-exposure holes (unauthenticated reads/writes of cached
responses; cleartext transport) while leaving development workflows
untouched. Verified before claiming success: 683 API tests passed,
coverage 92.96%, lint/type/contract checks all clean.

## 2026-08-18 — Extract to_wire so list and update share one row-to-API mapping

**WHAT changed:** Added a _module-level function_ named `to_wire`. A
function is a named recipe of steps you can call from other places;
_module-level_ means it sits at the top of the file, not inside a
_class_ (a class is a blueprint that groups related data and
functions). `to_wire` takes one _row_ — a single action item as stored
in the database, using snake_case names like `meeting_id` and Python
_date_ objects (calendar dates the program can compute with) — and
returns an `ActionItem` _schema_ object. A schema here is the shape of
data the API sends over the network: camelCase names like `meetingId`,
and dates turned into text with `.isoformat()` (a method that writes a
date as `"2026-08-20"`). If a date column is empty, the API sends
`None` (Python's "no value") instead. Both `list_items` (read every
item) and `update_item` (change one item, then return it) now call
`to_wire` instead of each copying the same 11-field constructor.
`update_item`'s body was also indented so it actually belongs to the
method, and `from datetime import date` was added because that method
uses `date.today()` when status becomes `"Done"`. A new test builds a
fake row and checks all 11 fields come out correctly.

**WHICH files:** `apps/api/app/repository.py` (the `to_wire` helper and
the two call sites) and `apps/api/tests/test_repository.py` (new test).

**WHY:** The two database methods were about to return items to the
caller using identical mapping code. Duplicating that mapping is
risky: if one field is added or renamed later, one path can be
updated and the other forgotten, so list and update would disagree
about what an item looks like. One shared function is the single
place that translation lives.

## 2026-08-18 — The deep review aimed at the wrong repo (and hit this one)

**WHAT:** The background automated review launched for agency-intelligence
PR #93 turned out to have run against the wrong project: a _subagent_ (a
helper program spawned to work independently) inherits its _working
directory_ (the folder a program treats as "here") from the session that
launches it, and this session lives in `note2action` — so the reviewer
found no PR #93 there and reviewed the local `refactor/web-restructure`
branch instead. The hand-done security review of the real PR #93, with
its two applied fixes, is unaffected. The mis-fire still produced value:
15 verified findings about note2action, several reproduced by actually
running the failing commands. Highlights: the new Postgres wiring crashes
every entry point on a machine without a hand-made `.env` file (settings
are required and the database _engine_ — the object managing connections —
is built at _import time_, i.e. the moment the code loads, even when the
in-memory mode is selected); an over-strict settings rule aborts on any
extra `.env` line; date helpers give wrong days outside UTC but the test
script pins `TZ=UTC` so tests can't see it; a typo'd `REPOSITORY` value
silently serves stub data; and the repo's own journal _hook_ (a script
the coding tool runs automatically around actions) flags files written
outside the repo — explaining this session's repeated journal prompts.

**WHICH files:** None edited in this segment — the only repo change
remains the uncommitted PR #93 fixes in
`/Users/macbook/Blen/agency-intelligence-wt/feat-26-gateway-response-cache/`
listed in the previous entry. The findings list lives in the session's
task output; nothing was posted to GitHub.

**WHY:** Lesson recorded for future sessions: when launching a review
subagent for another repository, state the absolute repo path in its
prompt (or launch from that directory), because subagents inherit this
session's working directory and will happily review whatever they find
there. Kyle has two open decisions: commit/push the PR #93 fixes, and
whether to re-run the deep review pointed at the right repo.

## 2026-08-18 — ActionItem schema fields can be left blank

**WHAT changed:** On the `ActionItem` _schema_ (the written description
of what one action item looks like when the API — the program that
answers web requests — sends or receives it), several fields are now
_optional_. Optional means the program will still accept the object if
that field is missing. In Python this is written `str | None = None`:
`str` is text, `|` means "or", `None` means "no value", and `= None`
is the _default_ (what to use when the caller does not provide
anything). `title`, `owner`, `due`, `priority`, `saved`, `note`, and
`status` all follow that pattern. `id`, `meetingId`, and `confidence`
still must be given. This sits alongside the earlier same-day change
that added `to_wire` (a shared translator from a database row to this
schema).

**WHICH files:** `apps/api/app/schemas.py`. (The mapper and its test
are in `apps/api/app/repository.py` and
`apps/api/tests/test_repository.py`, logged in the earlier
`to_wire` entry.)

**WHY:** The in-memory sample items and work-in-progress update path
construct `ActionItem` objects without filling every field. If the
schema required every field, those objects would be rejected as
invalid. Making the unused-for-now fields optional lets the rest of
the code run while the full create/update contract is still being
built.

## 2026-08-18 — Clarifying who reviewed what (no code changed)

**WHAT:** Nothing was edited this segment; this entry records a
clarification Kyle asked for. Question: did the review cover
agency-intelligence PR #93 or the note2action _monorepo_ (one repository
holding several apps/packages together)? Answer: both, by different
reviewers. PR #93 was reviewed by hand, directly against the real pull
request's changes and its checked-out branch — that review produced the
two security fixes recorded earlier. Separately, the automated background
reviewer launched to double-check PR #93 inherited this session's working
directory (the folder a program treats as "here"), found no PR #93 in
note2action, and reviewed the local `refactor/web-restructure` branch
instead — producing 15 findings that belong to note2action, not to the
PR.

**WHICH files:** No repository files changed. The only pending change
remains the uncommitted PR #93 security fixes in
`/Users/macbook/Blen/agency-intelligence-wt/feat-26-gateway-response-cache/`.
A reusable lesson ("pin the absolute repo path when launching review
agents") was saved outside the repo in the personal memory folder at
`~/.claude/projects/-Users-macbook-note2action/memory/`.

**WHY:** The distinction matters for trust in the review: the security
verdict and fixes for PR #93 came from the hands-on review of the actual
PR, so the wrong-repo mishap cost only the extra automated pass, not the
correctness of the delivered review. Kyle's two open decisions are
unchanged: commit/push the PR #93 fixes, and optionally re-run the deep
review pointed at the right repository.

## 2026-08-18 — PR #93 security fixes shipped (commit efa36e4)

**WHAT:** With Kyle's approval the two response-cache security fixes were
committed and pushed to the PR #93 branch — and nothing was posted on the
pull request itself (no comments, no description edits): pushing new
commits to a PR's branch updates the PR automatically, so the code change
travels without any commentary. The commit's subject line starts with a
lowercase verb ("harden…") to satisfy the repo's commitlint format rule,
and its body records both fixes plus the real verification numbers, per
the repo's evidence-before-claims habit. The repository's own _git hooks_
(scripts that run automatically around git actions) re-verified everything
in transit: the _pre-commit_ hook ran the guardrail sync check, contract
checks, web type check, and API lint; the _pre-push_ hook ran the test
suites. A background monitor now watches the PR's _CI_ (continuous
integration — the checks GitHub runs on every push) and will report when
all checks finish.

**WHICH files:** Committed in
`/Users/macbook/Blen/agency-intelligence-wt/feat-26-gateway-response-cache/`
as commit `efa36e4`: `docker-compose.yml` (Redis bound to 127.0.0.1),
`apps/api/app/core/config.py` (TLS-in-production validator),
`apps/api/tests/test_response_cache_config.py` (new, 6 tests),
`.env.example` (production note), and
`docs/plans/2026-08-18-26-gateway-response-cache.md` (addendum). Pushed to
`origin/feat/26-gateway-response-cache` (`c7052a4..efa36e4`).

**WHY:** Kyle said "commit fixes to pr but do not comment on pr" — so the
branch push is the whole update. The fixes close the two network-exposure
holes found in review (unauthenticated Redis reachable from the network;
cleartext cache transport allowed in production) while leaving the dev
workflow untouched.

## 2026-08-19 — #27 built: semantic (embedding-similarity) response cache

**WHAT changed:** Implemented ticket #27 for agency-intelligence: the
gateway cache can now serve _near-duplicate_ prompts, not just identical
ones. The idea: turn each prompt into an _embedding_ (a list of numbers
whose direction encodes the text's content, so similar texts point in
similar directions) and compare with _cosine similarity_ (the angle
between two vectors: 1.0 = same direction, 0 = unrelated). A "semantic
hit" needs cosine ≥ a configurable threshold AND an identical _params
fingerprint_ (a hash of everything in the request except the messages —
model, temperature, tools — because those change what a correct answer
is; only the prompt wording may vary). Scope, phi-exclusion, and
fail-open rules are inherited from the #26 exact-match cache rather than
reimplemented. Hits carry a new `x-ai-cache-match: semantic|exact`
header and a `match` field in the log event — the acceptance criterion
that semantic hits be distinguishable in telemetry. A deterministic
_eval_ (a scored, repeatable quality test that gates CI like a unit
test) measures hit precision on a labeled fixture set of duplicate and
distinct prompt pairs: precision 1.00, recall 0.83, wired into the
existing `api:eval` gate so it's never an orphaned test.

**WHICH files** (in `/Users/macbook/Blen/agency-intelligence-wt/feat-27-semantic-cache`,
a _stacked branch_ — built on the still-open #26 branch instead of main,
because it extends that PR's code):

- `apps/api/app/helpers/semantic_cache.py` — new: cosine, fingerprint,
  prompt extraction, deterministic hashing embedder, fail-open
  `SemanticCache` over Redis, Foundry embedder client.
- `apps/api/app/helpers/response_cache.py` — factored `get_redis_client()`
  so both cache layers share one client and one test seam.
- `apps/api/app/api/v1/routes.py` — exact lookup → semantic lookup →
  forward → store both (embedding computed once, reused).
- `apps/api/app/core/config.py`, `.env.example` — two settings, off by
  default.
- `apps/api/evals/semantic_cache_cases.py` + registration in
  `evals/cases.py`; tests `test_semantic_cache_unit.py` and
  `test_semantic_cache_gateway.py` (28 cases, written first).

**WHY:** Users re-ask the same question with tiny wording changes; an
exact-match cache misses all of them. Two bugs avoided by design: the
embedding must come from the prompt _before_ prompt-shaping mutates the
payload, and a top-level import of the API layer from a helper created a
_circular import_ (module A needs B which needs A, so one is only
half-loaded) — fixed with the repo's lazy-import-inside-the-function
pattern. The trickiest test-design point: a precision eval can pass
vacuously by never hitting anything, so a second "recall floor" case
requires most labeled duplicates to actually hit.

## 2026-08-19 — #27 security/best-practices review; embedder pinned into fingerprint

**WHAT changed:** Pre-ship review of the #27 semantic-cache branch. The
security question that mattered most: does the new embedding call leak
unredacted PII? Verified no — the FR-5 redaction _middleware_ (code that
runs on every request before the route handler sees it) rewrites the
request body first, so the text we embed is already redacted. Secrets
sweep clean; no prompt text, embeddings, or URLs in any log call. One
best-practices defect found and fixed TDD: the semantic _fingerprint_
didn't include which embedding model produced the vectors. Embeddings
from different models live in unrelated _vector spaces_ — comparing them
with cosine is meaningless — so switching deployments could have compared
new requests against stale incompatible vectors for up to one TTL. Fix:
the deployment name is now part of the fingerprint, so a switch instantly
strands old entries. Full hygiene re-run: black/ruff/mypy clean, 712
tests passed (92.91% coverage), evals 23/23 (precision 1.00), eslint and
prettier clean.

**WHICH files** (in `/Users/macbook/Blen/agency-intelligence-wt/feat-27-semantic-cache`):
`apps/api/app/helpers/semantic_cache.py` (embedder in fingerprint),
`apps/api/app/api/v1/routes.py` (threads the deployment name),
`apps/api/tests/test_semantic_cache_unit.py` (the failing-first test).

**WHY:** A cache key must capture everything that makes two cached values
comparable — for vectors, that includes the model that produced them.
This is the same key-completeness principle as the #26 delimiter fix:
review by asking "what change would make two incomparable things collide?"
Uncommitted; results handed to Kyle in chat.

## 2026-08-19 — Module 11: DBeaver + Postman, and the triage drill

**WHAT changed:** No code this module — I added two inspection tools and
ran a bug-triage drill. _DBeaver_ is a database GUI: it connects straight
to Postgres (localhost:5432, db note2action) and shows tables as
spreadsheets, answering "what is actually stored at rest?". _Postman_ is
an API client: a saved collection of requests against
`{{baseUrl}} = http://localhost:8001`, answering "what does the API say
and accept right now?". The drill: Claude secretly corrupted a row with
raw SQL (`UPDATE action_items SET status='In progress', completed=NULL
WHERE id=7`) — a write that bypassed the API, like a real-world manual
hotfix or rogue script — then filed a fake user bug report ("my Done task
un-did itself"). My job was to convict one layer: client, API, or data.

**WHICH files:** none in the repo — only database rows and my two new
tool setups. Repaired via Postman: `PATCH /api/items/7 {"status":"Done"}`
(the server re-stamped `completed`), confirmed at rest in DBeaver.

**WHY:** I got the verdict right (data layer) but my evidence was broken
in a way worth remembering. I reported "Postman says In progress, DBeaver
says Done" — an _impossible observation_, because GET /api/items runs a
live SELECT with no cache in between, so fresh reads can never disagree.
My DBeaver grid was a _stale snapshot_ (it queries once and never
auto-refreshes; hit ⌘R before trusting it). Lesson: when two instruments
contradict each other about the same fact, suspect an instrument before
the app. The clean chain: Postman shows the API believes the wrong value
→ fresh DBeaver shows the same wrong value at rest → API acquitted
(faithful reporter), data convicted (changed outside the API). Bonus: the
DB blocked Claude's first sabotage (`completed=NULL` while still Done)
via our CHECK constraint `ck_action_items_completed_iff_done` —
constraints defend invariants even against raw SQL, so the corruption
that gets through is always self-consistent-but-false, the sneakiest
kind.

## 2026-08-19 — Module 12 (web half): Clerk sign-in gate + token on every request

**WHAT changed:** The web app now has real authentication. _Clerk_ is a
hosted auth provider: it renders the sign-in/sign-up UI, stores the user
accounts, and hands the browser a _session token_ — a _JWT_ (a signed
blob naming the user) that our API will later verify on its own. The app
is gated: visiting any route while signed out redirects to /sign-in, and
every API request now carries an `Authorization: Bearer <token>` header.
The hardcoded USER constant ("Kyle Park / Product") is deleted — the
sidebar and the Home greeting now show the real signed-in account.

**WHICH files (all in apps/web):**

- `providers.tsx` — outermost `<ClerkProvider>` (reads
  `VITE_CLERK_PUBLISHABLE_KEY`, with a friendly on-screen message if it's
  missing) + `AuthTokenBridge`, a render-nothing component that registers
  Clerk's `getToken` with…
- `src/lib/auth-token.ts` (new) — a tiny bridge module, because hooks
  only work inside components but `http.ts` is a plain module. Providers
  register a token getter; http asks for it per request.
- `src/lib/http.ts` — awaits `getAuthToken()` and attaches the
  `Authorization` header when a token exists; tests and signed-out
  requests just omit it (the API decides what that means).
- `src/App.tsx` + `components/app/require-auth.tsx` (new) — public
  /sign-in and /sign-up routes; the layout route is wrapped in
  `RequireAuth`, which handles Clerk's three async states: loading (show
  "Checking session…", never redirect early), signed in (render app),
  signed out (redirect).
- `views/auth/sign-in.view.tsx` + `sign-up.view.tsx` (new) — Clerk's
  prebuilt components, `routing="hash"` so their multi-step flows
  navigate inside the widget without extra routes from us.
- `components/app/sidebar.tsx` — `<UserButton>` (avatar menu with
  sign-out) + real name/email via `useUser()`.
- `views/home/home.view.tsx` — greeting templates take the Clerk first
  name. `store/actionItems.constants.ts` — USER deleted.
- `.env.example` (new, checked in) — documents the key; the real
  `.env` stays gitignored. `vite-env.d.ts` — types the env var.
- `pnpm-workspace.yaml` — pnpm blocked @clerk/shared's _postinstall
  script_ (supply-chain guard: new deps can't run arbitrary code at
  install time) and wrote a placeholder that failed every install until
  a human decided; set to `false` because Clerk works without it.

**WHY:** Auth is the boundary between demo and product. The key mental
model: the _publishable key_ is public by design (it only identifies
which Clerk app the widget talks to); the browser gets a short-lived
signed token; and the backend must verify that token itself — never
trust the frontend. This half only makes the web app carry identity;
the API half (verify JWT, 401 strangers, stamp user_id from the
verified token) is next. Proof: 35 web tests, typecheck, build, lint
all green.

## 2026-08-19 — Module 12 (API half): verify the JWT, own the data

**WHAT changed:** The API now proves who's calling instead of trusting
whatever the browser says. A _middleware_ (code that runs on every
request before any endpoint) reads `Authorization: Bearer <token>`,
verifies the JWT's signature against Clerk's _JWKS_ (the app's published
_public_ keys — verification is local math, no call to Clerk and no
shared secret), and stashes the verified Clerk user id on
`request.state`. No/bad token → 401 before a handler ever runs; only
/api/health and the docs pages stay public. A route _dependency_ maps
that Clerk id to our `users` row (creating one on first visit), and
every repository method now takes `user_id` and answers only for that
user's rows — someone else's row returns 404, indistinguishable from a
missing row, so ids never leak. `user_id` is written from the verified
token, never from the request body. Also my first schema _change_
migration: add-nullable → backfill (items inherit their meeting's
owner) → tighten to NOT NULL — the three-step dance any live table
demands.

**WHICH files (apps/api):** `app/auth.py` (new: TokenVerifier protocol +
ClerkJWKSVerifier via PyJWT's PyJWKClient), `app/main.py` (middleware,
`current_user_id` dependency, all routes scoped), `app/models.py`
(users.clerk_id unique, action_items.user_id FK),
`migrations/versions/3337459970d8_…py` (the schema-change migration,
applied to the live DB), `app/repository.py` (get_or_create_user with an
IntegrityError race-retry; every method takes user_id; the in-memory
fake derives item ownership from its meeting), `app/settings.py` +
`.env.example` (CLERK_JWKS_URL), `tests/conftest.py` (FakeVerifier — the
auth seam's twin of the fake repository; in tests the bearer token IS
the user id), `tests/test_auth.py` (new: 401s, per-user isolation,
stranger-can't-touch), and auth headers added to the existing test
clients. `docs/api-design.md` auth convention updated. 20 API tests
green.

**WHY:** "The backend never trusts the frontend" is the whole lesson —
the token is the only claim of identity the API accepts, and it checks
the signature itself. Making 404 (not 403) the answer for other users'
rows keeps existence private. My old data needs a one-time link
(`UPDATE users SET clerk_id = 'user_…' WHERE id = 1`) because the app
can't know which Clerk account owns the pre-auth rows — account linking
is a data decision, not code.

## 2026-08-19 — Module 12 follow-up: users.name from a custom session claim

**WHAT changed:** Kyle's review caught that every authenticated signup
got `name="New user"` — the default Clerk session JWT carries only
identity claims (sub, exp, iss…), no profile. Fix: a _custom session
claim_ — the Clerk dashboard can embed extra fields inside the signed
token (`{"name": "{{user.full_name}}"}`), which makes them exactly as
tamper-proof as `sub`, unlike anything the client could send in a body.
`verify()` now returns a `VerifiedUser` dataclass (clerk_id + optional
name) instead of a bare string; claim parsing lives in
`identity_from_claims()`, a pure function unit-tested without any keys.
`get_or_create_user(clerk_id, name)` obeys two laws in both
implementations: use the name at creation (fallback "New user"), and
refresh it when the claim differs — but never erase on a missing claim
(None means "token doesn't say", not "no name").

**WHICH files (apps/api):** `app/auth.py` (VerifiedUser,
identity_from_claims), `app/main.py` (request.state.identity; dependency
passes name through), `app/repository.py` (both get_or_create_user
implementations + the fake's `_user_names`), `tests/conftest.py`
(FakeVerifier token grammar: "user_x|Jane Doe" — the pipe stands in for
the name claim), `tests/test_auth.py` (claims unit tests + end-to-end
name flow), `tests/test_repository.py` (the name laws). 23 API tests
green. Kyle's dashboard side: Sessions → Customize session token →
`{"name": "{{user.full_name}}"}`.

**WHY:** The lesson is _where_ trusted data can come from: request
bodies are the client talking (never trusted for identity/profile),
but claims inside a verified signature are the auth provider talking.
Extending the token is how you move a fact across the trust boundary
without a per-request API call to Clerk.

## 2026-08-19 — Module 13: Row-Level Security — the database enforces "yours only"

**WHAT changed:** Module 12's isolation lived in application code — a
`WHERE user_id = …` someone must remember in every query. _RLS_
(Row-Level Security) moves that rule into Postgres: a _policy_ attached
to the table that acts like a WHERE clause the database appends for you
and you cannot forget. Three pieces: (1) a new low-privilege role
`note2action_app` the API connects as — because superusers and table
owners BYPASS RLS entirely, the classic gotcha; connecting as `postgres`
would make every policy silently useless. (2) `ENABLE ROW LEVEL
SECURITY` on meetings + action_items. (3) Policies comparing each row's
user_id to `app.user_id`, a per-transaction variable the API sets from
the verified identity via `set_config(..., is_local=true)` (=`SET
LOCAL`, dies at transaction end so pooled connections can't leak one
request's identity into the next). `current_setting('app.user_id',
true)` returns NULL when unset and NULL compares false → forgetting to
set the user _fails closed_ (zero rows), never open. The `users` table
deliberately has no policy — identity lookup must run before a user id
exists (bootstrap). Migrations now run under a separate
MIGRATIONS_DATABASE_URL (admin role) while the app runs de-privileged —
two URLs, two jobs.

**WHICH files (apps/api):**
`migrations/versions/ba1b688e106a_…py` (role + grants + RLS + policies;
dev-only password committed knowingly — prod roles live in secret
managers, not git), `app/repository.py` (`_rls_session(user_id)`
contextmanager: first statement of every user-scoped transaction is
set_config; app-level WHERE filters kept on purpose — defense in depth),
`app/settings.py` + `migrations/env.py` (migrations_database_url),
`.env.example` (both URLs documented). 23 tests green.

**WHY:** Proof by psql: superuser sees all 26 rows (bypass demo); app
role with no identity sees 0 (fail-closed); as user 1 sees exactly the
13 owned rows; as user 999 sees 0, `UPDATE … WHERE id=7` hits 0 rows,
and an INSERT forging user_id=1 dies with "violates row-level security
policy". The lesson is _defense in depth_: two independent layers
enforcing one rule, so a bug in either isn't a breach. Checkpoint
pending: switch the app's DATABASE_URL to the new role, then the
comment-out-the-WHERE drill — the app must still leak nothing.

## 2026-08-19 — Module 13 checkpoint: the comment-out-WHERE drill

**WHAT changed:** Nothing permanent — the drill. With the app verified
to connect as `note2action_app`, Claude deliberately disabled the
app-layer filter (`.where(ActionItemRow.user_id == user_id)`) in
`list_items` — the classic "one forgotten WHERE" bug. The table held 31
rows; the unfiltered query returned 13 for user 1, 9 for user 2, 0 for
a stranger. Postgres appended the WHERE itself via the RLS policy. The
filter was then restored (diff clean, 23 tests green).

**WHICH files:** `apps/api/app/repository.py` (edited and reverted —
net zero).

**WHY:** This is the whole argument for _defense in depth_ made
visible: the exact bug that would have leaked every user's data under
Module 12's app-only filtering was a non-event under RLS. Two
independent layers, one rule; either survives the other's failure.

## 2026-08-20 — README rewritten to match the finished app

**WHAT changed:** The root `README.md` still described the Module 1
scaffold ("no auth, no database, bare-bones on purpose") — none of
which has been true since Phase B. It was rewritten to describe the
app as it exists after Module 13: what the product does (capture →
extract → review → tasks), the four packages and what each one is now
(web with Clerk sign-in + shadcn/ui, api with JWT middleware +
Postgres + Row-Level Security, ai with the extract route, shared as
the zod contract), a first-time setup section (the three `.env` files,
starting Postgres in Docker, running migrations, and the three Clerk
dashboard steps including the `name` session claim), the real API
surface (all eight routes and which need a token), a short
plain-language explanation of the three security layers, the
migration workflow, and updated script/port tables. It also documents
honestly that `pnpm dev` (the full Docker stack) predates the
database/auth modules — the api container has no `DATABASE_URL` or
Clerk env wired in, so today Compose is for Postgres only and the
apps run natively via `dev:local`.

**WHICH files:** `README.md` (full rewrite, then formatted with
Prettier so lint-staged has nothing to redo).

**WHY:** A README is the front door — the first thing a new developer
(or future me) reads. An outdated one is worse than none, because it
makes confident claims that are false ("no auth") and gives commands
that no longer produce a working app. The rewrite states the current
truth: what runs where, what secrets go in which gitignored file, and
which single stale path (`pnpm dev`) to avoid until the deploy/CI
phase wires the containers properly.

## 2026-08-21 — Restructure designed: spec written, nothing moved yet

**WHAT changed:** Kyle asked for a full restructure of the monorepo —
single responsibility everywhere — modeled on the FastAPI full-stack
template (but keeping all apps under `apps/`). No code moved yet; this
step produced the **design spec**: the complete target directory trees
(api gets the template's `api/routes` + `core` + new `services` +
split `repositories` layers; web gets a `domain/` layer between views
and lib, with feature components moving into their view's folder; the
shared zod contract and ai app split per domain), four boundary rules
(one-direction imports so circular dependencies are structurally
impossible), an evidence-backed old→new mapping for every file, and a
reference flow tracing one meeting from Postgres row to screen. Work
happens on a new branch `refactor/monorepo-restructure` cut from main
(PR #3 merged), carrying the uncommitted README rewrite along.

**WHICH files:** `docs/superpowers/specs/2026-08-21-monorepo-restructure-design.md`
(new). Also removed a stray empty `apps/web/src/docs/` folder created
by a mkdir that ran from the wrong working directory.

**WHY:** A restructure this size fails without a map: every file move
breaks imports, and the only way to keep 58 tests green throughout is
to know the destination and the rules before touching anything. The
spec is that map. A _design spec_ is the written agreement of what
we're building before building it — cheaper to argue with a document
than with a half-moved codebase. Approval gates stay as always: Kyle
reviews the spec before any implementation plan, and the plan before
any code moves.

## 2026-08-21 — Restructure planned: 14 tasks, every move mapped

**WHAT changed:** With the design spec approved (plus Kyle's added
style laws: loose coupling, glance-readable, neat and uniform — now
spec §4.5), the **implementation plan** was written: 14 tasks in three
phases. Phase 1 rebuilds the API onto the template skeleton (core →
models/schemas → repositories seam split → services → api package →
mirrored tests). Phase 2 rebuilds the web app (meetings/health domain,
items domain, extraction domain + query-client, feature components
into their views, kebab-case entry + layer sweep). Phase 3 splits the
shared zod contract and the ai app's extraction logic, then updates
the README. Every task ends with a verification gate (23 pytest / 35
vitest / typecheck / lint) and its own commit, so any wrong step is
one `git revert` away. Planning also caught real facts the design had
guessed wrong: `recent-modal` and `completion-card` belong to the
chrome (app-layout and sidebar import them), `slot-number.tsx` and the
`Screen` type are dead code with zero importers (deleted), the ai
app's `provider.ts` was already in `lib/`, and the zustand store
imports `queryClient` from `providers.tsx` — an upward import the plan
fixes by moving it to `lib/query-client.ts`.

**WHICH files:**
`docs/superpowers/plans/2026-08-21-monorepo-restructure.md` (new),
`docs/superpowers/specs/2026-08-21-monorepo-restructure-design.md`
(style laws added; mapping table corrected to match import evidence).

**WHY:** A plan for a refactor is a map of moves, and a wrong map is
worse than none — so every destination in this one is backed by a
grep of who actually imports the file, not by what "sounds right."
The per-task green-suite gates are the refactorer's seat belt: 58
tests that must pass after every step mean a behavior change can't
hide inside a file move.

## 2026-08-21 — Ruff set up at the repo root

**WHAT changed:** Running `uv run ruff` from the repository root
failed with an error that the `project.name` field was not set.
`uv` is a Python package manager: a program that installs Python
tools and libraries and runs them in a project. `Ruff` is a linter —
a checker that reads Python files and reports style and correctness
problems (unused imports, lines that are too long, and so on). The
root `pyproject.toml` is a configuration file: a text file that tells
Python tools how this project is set up. It had a `[project]` table
(a named section in that file) but no `name` field. A standard called
PEP 621 says: if you use `[project]`, you must also give the project a
`name`, written as a quoted string like `name = "note2action"`.
Unquoted values (`name = note2action`) are invalid TOML (the file
format `pyproject.toml` uses). The file was completed with `name`, a
`version` (a version number so tools know which edition this is),
`package = false` (this root folder is not a library you install; it
only holds config and tools), and Ruff listed as a **dev dependency**
(a tool used while developing, not part of the app users run). `uv add
--dev ruff` then installed Ruff so `uv run ruff check` works from the
root. The auto-fix flag belongs on the `check` command:
`uv run ruff check --fix`, not `uv run ruff --fix`.

**WHICH files:** `pyproject.toml` (root: added `name`, `version`, uv
`package = false`, Ruff as a dev dependency, kept the existing
`[tool.ruff]` settings). `uv.lock` (updated by uv when Ruff was
added — a lock file is a snapshot of the exact package versions that
were installed, so everyone gets the same tools).

**WHY:** Without a valid `name`, uv refuses to parse the file, so it
cannot start Ruff. Putting Ruff at the repo root means one command
can lint all Python in the monorepo (a single git repository that
holds more than one app or package). The 79-character line length from
Ruff's docs is still in place; it currently reports many findings in
`apps/api` and `numbers`.

## 2026-08-21 — Ruff: which rules auto-fix, and which we ignore

**WHAT changed:** `ruff check --fix` was reporting errors but changing
nothing. Ruff is a linter: a program that reads Python files and
reports problems. `--fix` is the auto-fix flag: it rewrites a file
only when a rule has a built-in patch. A rule is one named check,
such as "this line is too long." The findings were all
**report-only** (Ruff can point at them, but it will not rewrite
them): E501 (a line longer than the limit, including comments and
docstrings — a docstring is the `"""..."""` explanation under a
function), B008 (a function call used as a default argument, which
in FastAPI is the normal `Depends(...)` pattern — FastAPI is the web
framework the API uses, and `Depends` means "inject this value when
the request runs"), and DTZ011 (`date.today()` without a timezone).
The root config was changed so we only ask Ruff to auto-fix rules
that actually have a fixer, and we stop treating the others as
failures. `select` is the list of rule groups Ruff should run
(prefixes like `I` for import sorting, `UP` for modern Python
rewrites, `B` for bug-prone patterns). `ignore` turns a rule off:
E501 is ignored so the **formatter** owns line length. A formatter
is a tool (`ruff format`) that rewrites spacing and wrapping in
_code_; it still does not wrap comment or docstring prose. FastAPI's
`Depends`, `Query`, and `Path` are listed as immutable calls (calls
that are safe in argument defaults, so B008 ignores them). Alembic's
`env.py` (Alembic is the tool that applies database schema changes)
is allowed to import a module after other code (rule E402), because
that file loads settings after it has the migration config object.

**WHICH files:** `pyproject.toml` at the repository root (the
configuration file that tells Python tools how this project is set
up): `[tool.ruff]` now has `target-version = "py310"` (the oldest
Python version we write for), `[tool.ruff.lint]` with prefix-group
`select` and `ignore = ["E501"]`, `[tool.ruff.lint.per-file-ignores]`
for `apps/api/migrations/env.py`, `[tool.ruff.lint.flake8-bugbear]`
`extend-immutable-calls` for FastAPI, and `[tool.ruff.format]`
`docstring-code-format = true` (format code examples inside
docstrings). No application Python files were edited.

**WHY:** Auto-fix cannot wrap comments, rewrite FastAPI dependency
injection, or pick a timezone for `date.today()` — those need a
human. Configuring the linter to match that fact means
`uv run ruff check --fix` and `uv run ruff format` both pass, and
`--fix` will still rewrite the rules that _do_ have a safe patch
(unused imports, import order, simple modernizations).

## 2026-08-21 — The restructure is built: 14 tasks, 19 commits, zero behavior change

**WHAT changed:** The whole monorepo now matches the approved design.
The API was rebuilt in six steps onto the template skeleton: `core/`
(config, database, security, middleware), per-domain `models/` and
`schemas/` packages, the repository seam split into three protocols
with matching in-memory and Postgres implementations, a thin
`services/` layer (business rules with zero web-framework imports),
`api/routes/` with one file per resource, and a `main.py` that only
wires things together. The web app gained its `domain/` layer (items,
meetings, extraction, health — each owning its API calls, query hooks,
and state), feature components moved into their views, the shared
`queryClient` moved to `lib/` (killing the one upward import), and the
old `store/` folder is gone. The shared zod contract and the AI app's
extraction prompt each got their own modules. Every task was
implemented by a fresh subagent, reviewed by another, and gated on the
full suite: 35 vitest + 23 pytest green after every single step, plus
typecheck, lint, and a web build at each phase boundary. A final
whole-branch review (plus one docs-only fix wave) closed clean.

**WHICH files:** ~90 files across `apps/api`, `apps/web`,
`packages/shared`, `apps/ai`, `README.md`, and the spec — see the 19
commits from `142d4dd` to `e625249` on `refactor/monorepo-restructure`.

**WHY:** A refactor without gates is a rewrite in disguise; the
green-after-every-step rule is what makes "zero behavior change" a
verified fact instead of a hope. Reviews caught real drift the
implementers missed (a docstring that became false in its new home, a
comment claiming importers that don't exist), and execution caught a
planning error (slot-number was never dead — the planning grep's own
filter had hidden its importer). Lesson: evidence over confidence,
at every layer of the process.

## 2026-08-21 — Why the pycache folders kept coming back

**WHAT changed:** All `__pycache__` folders under `apps/api` were
deleted (twice — the first cleanup was immediately undone because the
verification `pytest` run recreated them, which is exactly how these
folders work). A new `.vscode/settings.json` was added with a
`files.exclude` rule so VS Code stops showing `__pycache__`,
`.pytest_cache`, and `.ruff_cache` in the file tree and search.

**WHICH files:** `.vscode/settings.json` (new, currently uncommitted);
15 → 0 `__pycache__` directories on disk (they were never in git —
the root `.gitignore` has always ignored them).

**WHY:** `__pycache__` is Python's bytecode cache: every time Python
imports a file it saves a compiled copy next to it so the next start
is faster. One folder appears per package directory, and the
restructure grew `apps/api` from two package directories to about
ten — so the same caching suddenly looked like "so many new files."
They are disposable and always regenerated, so the honest fix isn't
deleting them (any test run brings them back) but telling the editor
not to display them. Git was never affected either way.

## 2026-08-21 — The 500-on-Done bug: a response built on the wrong side of commit

**WHAT changed:** One reorder in
`apps/api/app/repositories/postgres/items.py` (`update_item`): the
wire response is now built **before** `session.commit()`, then
returned after. Verified with a throwaway-user reproduction script
(PATCH status=Done now returns the full item instead of a 500) and
the full suite (23 pytest green). Committed as `c31c989` and pushed
to PR #4.

**WHICH files:** `apps/api/app/repositories/postgres/items.py`.

**WHY:** Our RLS identity is set with `SET LOCAL`, which means "this
setting lives only until the transaction ends" — a safety feature so
pooled connections can't leak one user's identity into the next
request. But SQLAlchemy _expires_ loaded objects at commit: touch an
attribute afterward and it silently re-SELECTs the row in a new
transaction. New transaction → no identity → the RLS policy can't
cast an empty setting to an integer → error → 500. The sneaky part:
the UPDATE had already committed, so the client's refetch showed the
item as Done — the UI looked "wrong but right" because it showed the
database's real truth while only the PATCH's response had died.
Lesson: with transaction-scoped state, everything the response needs
must be gathered before the commit; `create_meeting` already did
this, and now `update_item` matches it.

## 2026-08-21 — Optimistic updates: the UI stops waiting for the server

**WHAT changed:** The three item mutations (edit/patch, delete,
save-to-tasks) are now **optimistic**: the moment you act, the cache
is transformed locally and every view updates instantly; the server's
answer then reconciles or reverts it. The transforms live as three
pure functions in `domain/items/items.cache.ts` (TDD'd — 7 new tests
written failing-first), each a mirror of a server rule: Done stamps
`completed` with today, leaving Done clears it, and batch-save only
touches unsaved non-Done items. `patchItem` now parses the PATCH
response (it used to throw it away), so a successful edit reconciles
straight from the server's authoritative copy — **no follow-up GET
/api/items after edits anymore**. Failures roll the cache back to a
snapshot AND refetch (healing the "write landed but the response
died" case we just debugged), with a toast explaining the revert —
the app's first visible error surface for writes, via a new `sonner`
Toaster that follows the app theme (placed in `components/app`, not
`components/ui`, because the ui layer is only allowed to import
`lib/utils`).

**WHICH files:** `domain/items/items.cache.ts` (+ test, new),
`items.queries.ts` (optimistic handlers), `items.api.ts` (patch
returns the server item), `components/app/toaster.tsx` (new),
`providers.tsx` (mounts Toaster), `package.json`/lockfile (sonner).
42 vitest + typecheck + lint + build green.

**WHY:** An _optimistic update_ says: apply the predicted result now,
verify later — the UI feels instant because the common case (server
agrees) needs no waiting and no refetch. The catch is you must mirror
the server's rules exactly (hence pure, tested transforms) and own
the failure path (snapshot rollback + refetch + a toast, because a
silent snap-back is indistinguishable from a bug).

## 2026-08-21 — Request-path guide: three journeys, hop by hop

**WHAT changed:** Started the approved comprehension pass. First piece
done: a new guide that traces three real trips through the whole stack,
naming the exact file and function at every hop — §1 a **read**
(opening Tasks: cache → hook → http → proxy → JWT middleware → route →
service → repository → RLS'd SQL → zod parse → render), §2 an
**optimistic write** (status → Done: cache transformed instantly from a
snapshot-backed mirror of the server's rules, reconciled from the PATCH
response, rolled back with a toast on failure), and §3 an **AI capture**
(notes → the Next.js extract route → Claude constrained to the shared
schema → one all-or-nothing meetings transaction → cache invalidations).
Four helper sessions are meanwhile rewriting the in-code comments to
match, package by package; their work isn't finished yet, so it isn't
journaled yet.

**WHICH files:** `docs/architecture/request-paths.md` (new). A comment
style brief lives outside the repo (job scratch), so it isn't listed.

**WHY:** Scattered per-file comments answer "what is this?", but the
question that was actually hard was "what happens, in order, when I
click?" A _request path_ is that order: every stop a request makes from
a click in the browser to a row in the database and back. Writing the
trips down once, with real file names, gives every in-code comment a
map to point at — and gives a reader a way to check the comments:
if code and map disagree, one of them is lying and gets fixed.

## 2026-08-21 — Comprehension comments, first package landed (shared + ai)

**WHAT changed:** The approved comment rewrite is landing package by
package. First one done: every module in the shared contract and the
AI app now opens with a plain-language header saying what the file is,
who calls it, and where it sits on a request's journey, plus short
notes on each exported schema/function. Verified that only comment
lines changed (87 added lines, zero code lines) and that the
`.describe()` strings — the sentences inside the extraction schema
that are literally sent to the AI model as instructions — are
byte-identical. Web and API comment passes are still in progress and
will be journaled when they land.

**WHICH files:** `packages/shared/src/*.ts` (6 files),
`apps/ai/lib/{provider,extraction}.ts`,
`apps/ai/app/api/{extract,chat}/route.ts`,
`apps/ai/app/{layout,page}.tsx`.

**WHY:** Comments are documentation that lives where the code lives —
but only help if they answer the reader's actual question. Here that
question is "how does this connect to everything else?", so each
header now names its callers and its place on the path, and every
technical term gets a plain-language gloss the first time it appears.
The byte-identical check on `.describe()` matters because those strings
aren't documentation at all — they're behavior (the model reads them).

## 2026-08-21 — Comprehension comments: views and chrome landed

**WHAT changed:** Second package of the comment rewrite is in: all 39
screen files and shared-chrome components now carry the standard header
(what the file is / who calls it / where it sits on the request path)
plus short notes on exported components and their props — including how
the optimistic mutations surface in the UI (task-row's status dropdown,
review-card's editors, the save-to-tasks button, and the toast outlet).
Verified comment-only: 172 added lines, zero code lines changed. The
API and web domain/lib passes are still running.

**WHICH files:** everything under `apps/web/src/views/` (view, store,
utils, and per-view components files) and
`apps/web/src/components/app/*.tsx`.

**WHY:** Same goal as the other packages — every file answers the
"how does this connect?" question where you're already reading. One
flag worth keeping: `docs/architecture/web.md` still describes the app
before optimistic updates existed, so that overview doc is now stale —
noted for a follow-up rather than silently expanded into this pass.

## 2026-08-21 — Comprehension comments: web domain and lib landed

**WHAT changed:** Third package in: the web app's `domain/` modules
(items, meetings, extraction, health), the `lib/` kernel (http,
query-client, auth-token, theme, dates, sound, utils), and the root
files (main, app, providers) now carry the standard headers, per-export
JSDoc, and path breadcrumbs. Verified comment-only via per-edit review
and a clean `tsc --noEmit`. Only the API package's pass is still
running; a final tightening sweep over old verbose method/class
comments (Kyle's request) comes after it lands.

**WHICH files:** 22 files across `apps/web/src/{domain,lib}` plus
`main.tsx`, `app.tsx`, `providers.tsx`, `test/fixtures.ts`.

**WHY:** These are the connective-tissue files — the exact layer where
"how does a click become a database row?" gets decided — so their
headers now spell out the chain (view → hook → http → API) instead of
assuming the reader already knows it.

## 2026-08-21 — Comment pass complete: tightened, and the path is numbered

**WHAT changed:** The last two pieces of the comprehension pass. First,
per Kyle's request, a tightening sweep compressed the over-long
comments: module headers down to ≤5 lines and method/class notes to
concise 1–2 liners across the 14 worst files — every constraint fact
(the RLS commit-ordering rule, 404-not-403, the name laws, the
Done ⟺ completed stamp) survived, just said shorter. Second, the
thirteen files on the canonical read journey now carry **numbered hop
markers**: each header's Path line says `§1 [hop N/15]`, where it came
from, and where it goes next — from the click (app.tsx, hop 1) through
the proxy, the JWT middleware, route, service, and repository to
Postgres (hop 11, the turnaround), then back up through the mappers,
schemas, and zod validation to the cache and the screen (hop 15). The
numbers match `docs/architecture/request-paths.md` §1 exactly, so the
doc is the map and the code is the territory, cross-referenced both
ways. Full gate green afterward: 42 vitest + 23 pytest + typecheck +
lint + build.

**WHICH files:** 14 tightened (across `apps/api/app`, `apps/web/src`,
`packages/shared/src`); 13 hop-marked (`app.tsx`, `tasks.view.tsx`,
`items.queries.ts`, `items.api.ts`, `http.ts`, `vite.config.ts`,
`middleware.py`, `routes/items.py`, `deps.py`, `services/items.py`,
`postgres/items.py`, `mappers.py`, `schemas/items.py`);
`docs/architecture/request-paths.md` (§1 notes the in-code markers).

**WHY:** A comment that says "who calls me" answers one hop; a numbered
trail answers the question Kyle actually had — "where exactly is the
request going next?" Now you can open any file on the route and walk
forward or backward by number, with the guide as the bird's-eye view.

## 2026-08-21 — Comment caps enforced on the API; every DB-bound step names its next hop

**WHAT changed:** Kyle set hard rules: file-top comments max 4 lines,
all other comments max 1–2 lines, and anything pointing toward the
database must say the next hop it takes. The API side is done: all 44
over-cap blocks compressed across 25 files, and 14 functions that were
short enough but silent about their destination now name it exactly —
each route says which service function it delegates to, each service
names the repository method it calls, each Postgres method states the
SQL it emits through the RLS session. Verified: an AST sweep shows
zero over-cap docstrings, 23 pytest still green, and every protected
fact (the commit-ordering rule, 404-not-403, name laws, fail-closed
RLS) survived in shorter words. The web/shared/ai half is in progress.

**WHICH files:** 25 files under `apps/api/app/`.

**WHY:** A comment that's too long doesn't get read, and a chain with
one silent link breaks the trail. The caps keep every note scannable;
the next-hop rule means you can stand at any point in the request
path and know, without guessing, where execution goes next.

## 2026-08-21 — Caps enforced everywhere: zero over-long comments remain

**WHAT changed:** The second half of Kyle's comment rules landed on the
web app, the shared contract, and the AI app: all 59 remaining
over-cap blocks compressed (file headers ≤4 lines, everything else
≤1–2), every request-initiating hook and function now names its next
hop inside its short comment, and one straggler the scanner missed (a
4-line JSX hover note in the meetings view) was hand-tightened. A
repo-wide rescan now reports **zero** violations, and the full gate is
green: 42 vitest + 23 pytest + typecheck + lint + production build.
The protected content survived compression everywhere — the optimistic
mutation semantics, the wire↔view null/"" border, the note that the
extraction schema's `.describe()` strings are instructions the AI
model actually reads, and all the numbered `Path §1 [hop N/15]`
markers.

**WHICH files:** 44 files across `apps/web/src`, `packages/shared/src`,
and `apps/ai` (plus `views/meetings/meetings.view.tsx` by hand).

**WHY:** Rules only count when they hold everywhere — a cap with
exceptions isn't a cap. The rescan-to-zero is the proof, the same way
the test suite is proof for behavior: don't trust that the sweep
worked, measure it.

## 2026-08-23 — The Done animation now ends itself: setTimeout removed

**WHAT changed:** The only `setTimeout` in the codebase is gone. When a
task is set to "Done", the row plays a half-second celebration
animation before the PATCH fires and the row leaves for History.
Before, a timer hard-coded that wait as `500` in JavaScript —
duplicating a duration that already lives in CSS (`taskComplete` is
`0.5s` in `global.css`). Now the animation itself reports when it's
finished: the row listens for the browser's `animationend` event
(React's `onAnimationEnd` prop) and only then tells the view to send
the PATCH. A guard checks `e.animationName === "taskComplete"` because
`animationend` _bubbles_ — the ✓ burst child plays its own animation,
and without the guard its ending would fire the patch too. CSS is now
the single owner of the duration: retune the animation and the code
needs no edit.

**WHICH files:** `apps/web/src/views/tasks/tasks.view.tsx` (timer
removed; new `handleCompleted` sends the patch),
`apps/web/src/views/tasks/components/task-row.tsx` (new `onCompleted`
prop + `onAnimationEnd` listener).

**WHY:** A timer next to an animation is the same number written twice
— they drift apart the first time someone retunes the CSS, and then
the row unmounts mid-animation or lingers after it. Event-driven
sequencing ("the effect tells you when it's done") has one source of
truth. Gates after the change: 0 type errors, 42/42 vitest, lint
clean.

## 2026-08-23 — Integration tests: a real throwaway Postgres now checks what the fake can't

**WHAT changed:** The API grew a second test suite. The existing 23
unit tests use in-memory fakes — fast, but blind to database physics
(RLS, commit ordering). The new integration suite (11 tests, marked
`@pytest.mark.integration`) runs against a REAL throwaway database:
each run drops and recreates `note2action_test`, runs the actual
alembic migrations (so the RLS policies match production law exactly),
points the app's `SessionLocal` at it, and truncates tables between
tests. Plain `pytest` still runs only the fast suite; `pytest -m
integration` opts into the real one. Highlights: a regression test for
the 500-on-Done bug (response must be built before `commit()`), and a
discovery — after a committed transaction, a `SET LOCAL` GUC degrades
to `''` on that connection, so the RLS policy's `::int` cast ERRORS
rather than returning NULL/zero rows. Both paths are now pinned by
tests: fresh connection → 0 rows; dead identity → loud error. Either
way, no data leaks — "fails closed" has two faces.

**WHICH files:** `apps/api/tests/integration/{__init__,conftest,
test_postgres_repositories,test_api_postgres}.py` (new),
`apps/api/pyproject.toml` (marker + default deselect).

**WHY:** The fake proves the app's logic; only real Postgres proves
the app's _agreements with Postgres_. The 500 bug lived exactly in
that gap for weeks. Now `pytest -m integration` walks the gap on
demand — endpoint to database and back — in under a second.

## 2026-08-23 — Structural audit: seven findings fixed, repo hardened for review

**WHAT changed:** A full audit of the monorepo (import-boundary greps,
config, deployment, docs) surfaced seven findings; all fixed. (1) The
`docker compose` api service could never boot — it received no
environment, and `DATABASE_URL` is required. It now gets in-network
URLs (`postgres:5432`, not `localhost`) plus `depends_on`, and loads
`CLERK_JWKS_URL` from the gitignored `.env`. (2) `REPOSITORY` is now a
strict `Literal["postgres", "memory"]` with **no default** — a typo'd
value crashes at startup with a clear pydantic error instead of
silently running on RAM and losing every write (proven by test:
`REPOSITORY=postgress` → literal_error). (3) CI now exists:
`.github/workflows/ci.yml` runs eslint+ruff, typecheck, both vitest
suites, pytest unit, and pytest integration against a real Postgres
service container, on every push/PR. (4) All TanStack cache keys moved
to `lib/query-keys.ts` — keys are addresses, not behavior, so
cross-domain invalidation no longer imports another domain's hook
module (the tightest coupling the audit found). (5)
`docs/architecture/web.md` was rewritten — it still described the
pre-restructure layout (`store/actionItems.store`) and pre-optimistic
behavior. (6) `ruff` (a Python linter) joined `apps/api`'s dev deps
and the root `lint` script; it found and fixed 4 real issues. (7) The
AI app got its first tests (5, with the model call mocked) and its
extract route now returns **400** on malformed bodies instead of
crashing to a 500 — plus this journal moved from repo root to
`docs/learning-journal.md`, with the Stop hook repointed.

**WHICH files:** `docker-compose.yml`, `apps/api/app/core/config.py`,
`.github/workflows/ci.yml` (new), `apps/web/src/lib/query-keys.ts`
(new) + 4 domain files rewired, `docs/architecture/web.md`,
`apps/api/pyproject.toml`, `package.json`,
`apps/ai/{vitest.config.ts,lib/extraction.test.ts,app/api/extract/route.test.ts}`
(new) + `route.ts`, `.claude/settings.json`, `memory.md` →
`docs/learning-journal.md`.

**WHY:** Polish is mostly about failure modes: a dev command that
crashes on first run, a config that fails silently, tests nothing
runs, and docs that lie all signal carelessness to a reviewer. Every
gate is green after the pass: eslint+ruff clean, 0 type errors, 42+5
vitest, 23 unit + 11 integration pytest.

## 2026-08-24 — Review fixes: query-key collision (P0), derived zod schemas, typed filters

**WHAT changed:** A code review found one real bug and a set of
polish items; all fixed. The bug: both meeting queries keyed off the
same tuple — a list with limit 3 and the detail for meeting id 3 both
cached as `["meetings", 3]`, one slot holding two different shapes
(an array vs an object), crashing `.map` when they collided. A query
key is an _identity_, not a label — `meetingsKey` is now a factory
namespacing by kind: `meetingsKey.list(limit)` /
`meetingsKey.detail(id)` / `meetingsKey.all` (for invalidation, which
prefix-matches both). Zod schemas now encode _relationships_ instead
of restating shapes: `ActionItemPatch` is derived
(`ActionItem.pick(...).partial()`), `MeetingDetail` extends `Meeting`,
and persisted `confidence` is `int().min(0).max(100)` — while raw AI
confidence stays deliberately loose (it's pre-normalization; different
role, different constraint). Filter store fields went from bare
`string` to unions (`Status | "All"` etc.) with `FilterSelect` made
generic, so a typo'd filter value is now a compile error. The
confidence-clamping logic moved out of the store's `.map` into a
named, unit-tested `normalizeConfidence` (3 new tests). All five
zustand stores now consistently wrap `devtools` with named actions.
Three review items were already fixed by the earlier restructure
(extraction.api.ts rename, dead Screen type, stray logs/).

**WHICH files:** `apps/web/src/lib/query-keys.ts`,
`domain/meetings/meetings.queries.ts`, `domain/items/items.queries.ts`,
`domain/extraction/{extraction.store.ts,extraction.utils.ts(+test)}`,
`views/tasks/tasks.store.ts`, `views/history/history.store.ts`,
`components/app/filter-select.tsx`, `domain/items/items.constants.ts`,
`lib/theme.store.ts`, `packages/shared/src/{items.ts,meetings.ts}`.

**WHY:** The collision was a latent production TypeError waiting for
id 3 to meet limit 3. The rest is about making illegal states
unrepresentable: derived schemas can't drift from their source, union
types can't hold a typo, and a named pure function can be tested
without mounting a store. Gates: eslint clean, 0 type errors, 45+5
vitest, 23 pytest.

## 2026-08-24 — Confidence constrained at the source: the model itself returns 1-100

**WHAT changed:** Yesterday's fix normalized AI confidence client-side
(0.9 or 90 both accepted, clamped after). Today the constraint moved
to the source: the shared `ExtractedItem.confidence` schema is now
`z.number().int().min(1).max(100)` with a describe() saying "whole
number, never a 0-1 fraction." Because `generateObject` compiles the
zod schema into the model's JSON-schema output constraints, a
fractional confidence is now rejected at _generation time_ — the model
is steered to comply, and non-compliance fails loudly instead of
being silently patched up. That made `normalizeConfidence` not just
redundant but dangerous — its "value <= 1 means ratio" guess would
turn a legitimate confidence of 1 (one percent) into 100 — so the
helper, its tests, and the store's .map were deleted. The contract is
now enforced three times on one journey: model generation, the ai
route's response, and the web's zod parse in extraction.api.ts.

**WHICH files:** `packages/shared/src/extraction.ts`,
`apps/web/src/domain/extraction/extraction.store.ts`,
`extraction.utils.ts` + test (deleted).

**WHY:** "Put a constraint where the invariant actually holds" has a
sequel: _move_ the invariant upstream when you can. Once the source
guarantees whole 1-100, downstream normalization stops documenting a
loose contract and starts hiding a strict one — deleting it keeps the
code honest. Gates: 0 type errors, 42+5 vitest, eslint clean.

## 2026-08-25 — Comment sweep: every header at 2 lines, one `/** */` voice everywhere

**WHAT changed:** A repo-wide comment restyle, no behavior touched. Every
file's topline comment (the note at the very top saying what the file is
for) was compressed from 3-4 lines down to a hard cap of 2, and every
function/component/module comment now uses the same shape: a JSDoc block —
the `/** … */` form editors read to show hover-help — kept to one or two
lines, e.g. `/** PATCH one item; returns the server's copy — `completed`
is stamped there. */`. The old `// line comments` above declarations were
converted to that form; comments _inside_ function bodies stay as `//` but
were trimmed to the same cap. Python files got the equivalent treatment
with docstrings (the `"""…"""` text Python attaches to a module or
function): multi-paragraph module headers and function docs squeezed to
1-2 lines. The long-form "Path: a → b → c" breadcrumbs were folded into
the 2-line budget as a short "Next hop:" or "Path §1 [hop N/15]" tail, so
the request-journey markers survive. Alembic's stock template chatter in
`migrations/env.py` ("this line sets up loggers basically") was replaced
with one-liners; the generated revision-header docstrings in the
migration files were left alone since Alembic wrote those. Load-bearing
constraint facts (RLS skips superusers, unset `app.user_id` fails CLOSED,
Done ⟺ completed, 404-never-403) were compressed, never dropped.

**WHICH files:** ~90 source files across all four workspaces:
`apps/web/src/**` (lib, domain, views, components/app, configs),
`apps/ai/{app,lib}/**`, `packages/shared/src/*`, `apps/api/app/**`
(routes, core, models, repositories, schemas, services),
`apps/api/migrations/env.py` + version files (comments only),
`apps/api/tests/**`, `eslint.config.mjs`. Untouched: `components/ui/*`
(generated shadcn code carries no comments) and `next-env.d.ts`.

**WHY:** A comment style is a contract with the reader: when every file
answers "what am I, and where does the request go next" in the same two
lines, scanning the codebase gets faster and long headers stop rotting
into prose nobody updates. Gates after the sweep: eslint + ruff clean,
prettier clean, 0 type errors, 42+5 vitest, 23 pytest.
