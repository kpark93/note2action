/** Calls the AI app's extraction endpoint — the first network hop of capture. */
import {
  ExtractResponse,
  type ExtractRequest,
  type ExtractedItem,
} from "@note2action/shared";
import { request } from "@/lib/http";

/** Sends notes to the AI app; the shared schema surfaces contract drift here. */
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
