import {
  ExtractResponse,
  type ExtractRequest,
  type ExtractedItem,
} from "@note2action/shared";
import { request } from "@/lib/http";

/**
 * Send notes to the AI app (via the `/ai-api` dev proxy) and get back typed
 * action items. The shared `ExtractResponse` schema validates the payload, so a
 * drifting API surfaces here rather than deep in the UI.
 */
export async function extractActionItems(
  payload: ExtractRequest,
): Promise<ExtractedItem[]> {
  const { items } = await request("/ai-api/extract", {
    method: "POST",
    body: payload,
    schema: ExtractResponse,
  });
  return items;
}
