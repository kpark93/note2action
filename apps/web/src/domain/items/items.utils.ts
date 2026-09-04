/** Shared cross-view item helpers; counts and partitions moved to the API's
 * summary endpoint and per-view queries. Leaf — no network. */

/** Two-letter initials for an avatar badge; "?" for the Unassigned owner.
 * Used by tasks.utils.ts. */
export function initials(owner: string): string {
  if (owner === "Unassigned") return "?";
  const parts = owner.split(" ");
  return parts[0][0] + (parts[1] ? parts[1][0] : "");
}
