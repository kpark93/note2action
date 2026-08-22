// The extraction prompt + model call — the part of the AI capture path that
// actually turns notes into structured items.
// Called only by api/extract/route.ts, which is a thin HTTP adapter over
// this function.
// Path: extract/route.ts → [this file] → lib/provider.ts's extractModel().
import { generateObject } from "ai";
import { ExtractResponse, type ExtractRequest } from "@note2action/shared";
import { extractModel } from "@/lib/provider";

/**
 * Run the extraction model over raw notes. `generateObject` constrains the
 * model to the ExtractResponse schema (packages/shared) and validates the
 * result, so callers always get well-formed items back. The schema's
 * `.describe()` strings are sent to the model as part of its instructions —
 * see extraction.ts in packages/shared, not duplicated here.
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
