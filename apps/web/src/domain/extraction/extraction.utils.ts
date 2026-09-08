/** Pure derivations for the capture flow. Leaf — no network, no cache. */

interface MutationSnapshot {
  status: string;
  error: unknown;
}

/** Flow status from the extract mutations' cache states, newest attempt
 * last — an old failure never outranks a fresh pending or success. */
export function latestExtractionStatus(states: MutationSnapshot[]): {
  extracting: boolean;
  extractError: string | null;
} {
  const latest = states[states.length - 1];
  return {
    extracting: latest?.status === "pending",
    extractError:
      latest?.status === "error"
        ? latest.error instanceof Error
          ? latest.error.message
          : "Extraction failed"
        : null,
  };
}
