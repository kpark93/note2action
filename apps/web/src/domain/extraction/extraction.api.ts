/** Calls the AI app's extraction endpoint — the first network hop of AI capture.
 * Next hop: lib/http.ts → /ai-api/extract (proxy) → /api/extract. */
import {
  ExtractResponse,
  type ExtractRequest,
  type ExtractedItem,
} from "@note2action/shared";
import { request } from "@/lib/http";

/** Sends notes to the AI app; the shared ExtractResponse schema validates the
 * reply so contract drift surfaces here. */
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
