// Fixed options and sample notes. The v2 mock's seed items and fake "recent
// captures" used to live here too — real data comes from the API now.
import type { Priority, Status } from "./actionItems.types";

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

export const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

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
