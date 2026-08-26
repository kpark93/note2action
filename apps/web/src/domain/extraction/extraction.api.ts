// Calls the AI app's extraction endpoint — the first network hop of AI
// capture. Called only by extraction.store.ts (extractNotes).
// Path: [this file] → lib/http.ts → AI app (/ai-api/extract → proxy →
// /api/extract). (request-paths.md §3)
import {
  ExtractResponse,
  type ExtractRequest,
  type ExtractedItem,
} from "@note2action/shared";
import { request } from "@/lib/http";

/**
 * Sends notes to the AI app via lib/http.ts → /ai-api/extract; the shared
 * `ExtractResponse` schema validates the reply so drift surfaces here.
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
