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
