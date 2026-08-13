import {
  ExtractResponse,
  type ExtractRequest,
  type ExtractedItem,
} from "@note2action/shared";

/**
 * Send notes to the AI app (via the `/ai-api` dev proxy) and get back typed
 * action items. `.parse` validates the payload against the shared contract, so
 * a drifting API surfaces here rather than deep in the UI.
 */
export async function extractActionItems(
  payload: ExtractRequest,
): Promise<ExtractedItem[]> {
  const res = await fetch("/ai-api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Extraction failed (HTTP ${res.status})`);
  }
  return ExtractResponse.parse(await res.json()).items;
}
