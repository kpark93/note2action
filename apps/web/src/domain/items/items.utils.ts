/** Shared cross-view item helpers. Leaf — no network. */

/** Two-letter initials for an avatar badge; "?" for the Unassigned owner. */
export function initials(owner: string): string {
  if (owner === "Unassigned") return "?";
  const parts = owner.split(" ");
  return parts[0][0] + (parts[1] ? parts[1][0] : "");
}
