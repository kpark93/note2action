// The extraction prompt + model call — turns notes into structured items.
// Called only by api/extract/route.ts, a thin HTTP adapter over this
// function.
// Path: extract/route.ts → [this file] → lib/provider.ts's extractModel().
import { generateObject } from "ai";
import { ExtractResponse, type ExtractRequest } from "@note2action/shared";
import { extractModel } from "@/lib/provider";

/**
 * Runs the extraction model via `generateObject`/ExtractResponse — its
 * `.describe()` strings are model instructions (see extraction.ts, shared).
 */
export async function extractItems(
  request: ExtractRequest,
): Promise<ExtractResponse> {
  const { notes, meetingTitle, today, owners } = request;
  const { object } = await generateObject({
    model: extractModel(),
    schema: ExtractResponse,
    system:
      "You are note2action's extraction engine. Read raw meeting notes and " +
      "return only concrete, actionable to-do items. Infer each item's owner, " +
      "priority, and due date, and rate your confidence. Never invent tasks " +
      "that the notes don't imply.",
    prompt:
      `Today is ${today}. Meeting: "${meetingTitle}".\n` +
      `Known owners: ${owners.join(", ")}. Use "Unassigned" when no owner is clear.\n` +
      `Resolve relative dates (e.g. "next week", "Friday", "before the 20th") to ` +
      `an absolute YYYY-MM-DD using today's date; use "" when no date is implied.\n\n` +
      `NOTES:\n${notes}`,
  });
  return object;
}
