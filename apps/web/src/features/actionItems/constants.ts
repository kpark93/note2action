// Seed data and fixed options, ported verbatim from the v2 (revised) design mock.
import type { ActionItem, Status } from "./types";

export const OWNERS = [
  "Rachel Ng",
  "Kyle Park",
  "Marcus Hale",
  "Priya Shah",
  "Unassigned",
] as const;

export const STATUSES: Status[] = [
  "Not started",
  "In progress",
  "Blocked",
  "Done",
];

/** "Today" is pinned so the seeded due/completed dates stay meaningful. */
export const TODAY = "2026-08-11";

/** Confidence below this is flagged as "needs review". */
export const LOW_CONFIDENCE_THRESHOLD = 80;

const SAMPLE = `Weekly sync — Aug 10

Rachel: pricing page needs to be live before the board deck goes out. She'll own the copy, aiming for Friday.
Kyle: API rate limits are still biting the mobile team — wants a fix landed next week.
Marcus mentioned churn deck for the board, sometime before the 20th?
Priya: onboarding email sequence rewrite, low urgency.
Someone should follow up with the Northwind account about the renewal — unclear who owns this.
Also: decide whether we keep the legacy export endpoint. No date discussed.`;

export const DEFAULT_RAW = SAMPLE;
export const DEFAULT_MEETING_TITLE = "Weekly Sync — Aug 10";

/** Rotated through by "Paste sample notes" on the Capture screen. */
export const SAMPLES: { title: string; text: string }[] = [
  { title: "Weekly Sync — Aug 10", text: SAMPLE },
  {
    title: "Design review — Aug 6",
    text: `Design review — Aug 6

Priya walked through the new Tasks table. Consensus: ship the compact row, but she needs to redraw the empty state first — before Thursday.
Kyle flagged that the mobile bundle is back over 400kb; he'll profile it this week.
Rachel: can we get a real onboarding illustration instead of the placeholder? She'll brief the contractor.
Open question on whether filters persist across sessions — nobody owned this.
Marcus wants a shared spec doc for confidence scoring by end of month.`,
  },
  {
    title: "Q3 planning — Jul 29",
    text: `Q3 planning — Jul 29

Marcus: headcount plan needs sign-off from finance before the 15th. He's driving.
Rachel owns the pricing experiment writeup — two weeks, no hard date.
Kyle: billing webhooks migrate to v2, blocked on the vendor sandbox.
Priya to audit onboarding drop-off and bring numbers to the next planning session.
Someone needs to cancel the unused analytics contract — Marcus thinks it renews in September?`,
  },
  {
    title: "Northwind kickoff — Jul 22",
    text: `Northwind kickoff — Jul 22

Northwind wants SSO before their security review; Kyle estimated ten days.
Rachel: send the revised SOC 2 evidence packet, they're waiting on it.
Their procurement lead asked about a sandbox tenant — unclear if we support that today.
Marcus to confirm renewal pricing internally, then take it back to them next week.
Also agreed: weekly status email, Fridays. No owner named.`,
  },
];

export interface Recent {
  name: string;
  count: string;
  when: string;
  /** Full transcript, shown in the modal and loadable into Capture. */
  text: string;
}

/** Recent captures shown on the Capture screen (click to open the transcript). */
export const RECENTS: Recent[] = [
  {
    name: "Design review — Aug 6",
    count: "9 items",
    when: "5d ago",
    text: `Design review — Aug 6
Attending: Priya Shah, Kyle Park, Rachel Ng, Marcus Hale

Priya walked through the new Tasks table. Consensus: ship the compact row, but she needs to redraw the empty state first — before Thursday.

Kyle flagged that the mobile bundle is back over 400kb after the chart library landed. He'll profile it this week and report back with a plan rather than a fix.

Rachel: can we get a real onboarding illustration instead of the placeholder? She'll brief the contractor and share options at the next review.

Open question on whether filters persist across sessions — nobody owned this in the room.

Marcus wants a shared spec doc for confidence scoring by end of month so support can explain the badge to customers.`,
  },
  {
    name: "Q3 planning — Jul 29",
    count: "14 items",
    when: "13d ago",
    text: `Q3 planning — Jul 29
Attending: Marcus Hale, Rachel Ng, Kyle Park, Priya Shah

Marcus: headcount plan needs sign-off from finance before the 15th. He's driving it and will loop in Rachel for the pricing assumptions.

Rachel owns the pricing experiment writeup — roughly two weeks, no hard date agreed.

Kyle: billing webhooks migrate to v2, currently blocked on the vendor sandbox being provisioned.

Priya to audit onboarding drop-off and bring real numbers to the next planning session.

Someone needs to cancel the unused analytics contract — Marcus thinks it renews in September but wasn't sure.`,
  },
  {
    name: "Northwind kickoff — Jul 22",
    count: "6 items",
    when: "20d ago",
    text: `Northwind kickoff — Jul 22
Attending: Marcus Hale, Rachel Ng, Kyle Park + Northwind (3)

Northwind wants SSO before their security review; Kyle estimated ten days of work assuming no surprises with their IdP.

Rachel: send the revised SOC 2 evidence packet — they're waiting on it and it's holding up procurement.

Their procurement lead asked about a sandbox tenant. Unclear if we support that today; needs a real answer.

Marcus to confirm renewal pricing internally, then take it back to them next week.

Also agreed: weekly status email, Fridays. No owner named in the meeting.`,
  },
];

export const SEED_ITEMS: ActionItem[] = [
  { id: 1, title: "Ship pricing page copy before board deck", owner: "Rachel Ng", due: "2026-08-14", priority: "High", confidence: 96, status: "In progress", note: "“pricing page needs to be live before the board deck goes out”", meeting: "Weekly Sync — Aug 10" },
  { id: 2, title: "Land fix for API rate limits on mobile", owner: "Kyle Park", due: "2026-08-17", priority: "High", confidence: 91, status: "Not started", note: "“wants a fix landed next week”", meeting: "Weekly Sync — Aug 10" },
  { id: 3, title: "Draft churn analysis deck for board", owner: "Marcus Hale", due: "2026-08-20", priority: "Medium", confidence: 74, status: "Not started", note: "Date inferred from “sometime before the 20th?” — confirm the deadline.", meeting: "Weekly Sync — Aug 10" },
  { id: 4, title: "Rewrite onboarding email sequence", owner: "Priya Shah", due: "2026-08-28", priority: "Low", confidence: 88, status: "Not started", note: "“onboarding email sequence rewrite, low urgency”", meeting: "Weekly Sync — Aug 10" },
  { id: 5, title: "Follow up with Northwind on renewal", owner: "Unassigned", due: "2026-08-21", priority: "Medium", confidence: 52, status: "Blocked", note: "No owner named in the transcript, and the date is a guess.", meeting: "Weekly Sync — Aug 10" },
  { id: 6, title: "Decide on deprecating legacy export endpoint", owner: "Kyle Park", due: "", priority: "Low", confidence: 61, status: "Not started", note: "No date discussed — added as unscheduled.", meeting: "Weekly Sync — Aug 10" },
  { id: 20, title: "Send revised SOC 2 evidence to Northwind", owner: "Rachel Ng", due: "2026-08-11", priority: "High", confidence: 94, status: "Done", completed: "2026-08-10", meeting: "Northwind kickoff — Jul 22" },
  { id: 21, title: "Cut mobile bundle under 400kb", owner: "Kyle Park", due: "2026-08-10", priority: "High", confidence: 90, status: "Done", completed: "2026-08-10", meeting: "Design review — Aug 6" },
  { id: 22, title: "Finalize Q3 headcount plan", owner: "Marcus Hale", due: "2026-08-07", priority: "Medium", confidence: 87, status: "Done", completed: "2026-08-06", meeting: "Q3 planning — Jul 29" },
  { id: 23, title: "Ship empty-state copy for Tasks", owner: "Priya Shah", due: "2026-08-07", priority: "Low", confidence: 82, status: "Done", completed: "2026-08-05", meeting: "Design review — Aug 6" },
  { id: 24, title: "Migrate billing webhooks to v2", owner: "Kyle Park", due: "2026-08-03", priority: "High", confidence: 93, status: "Done", completed: "2026-07-31", meeting: "Q3 planning — Jul 29" },
  { id: 25, title: "Approve renewal pricing for Northwind", owner: "Marcus Hale", due: "2026-07-28", priority: "Medium", confidence: 89, status: "Done", completed: "2026-07-29", meeting: "Northwind kickoff — Jul 22" },
];
