/** The extraction prompt + model call — turns raw notes into structured items.
 * Next hop: lib/provider.ts `extractModel()` → Anthropic API. */
import { generateText, Output } from "ai";
import { ExtractResponse, type ExtractRequest } from "@note2action/shared";
import { extractModel } from "@/lib/provider";

/** Runs `generateText` with an `Output.object` spec of the ExtractResponse
 * schema — its `.describe()` strings double as model instructions. */
export async function extractItems(
  request: ExtractRequest,
): Promise<ExtractResponse> {
  const { notes, meetingTitle, today, owners } = request;
  const { output } = await generateText({
    model: extractModel(),
    output: Output.object({ schema: ExtractResponse }),
    system:
      "You are note2action's extraction engine. Read raw meeting notes and " +
      "return only concrete, actionable to-do items. Infer each item's owner, " +
      "priority, and due date. Never invent tasks that the notes don't imply.",
    prompt:
      `Today is ${today}. Meeting: "${meetingTitle}".\n` +
      `Known owners: ${owners.join(", ")}. Use "Unassigned" when no owner is clear.\n` +
      `Resolve relative dates (e.g. "next week", "Friday", "before the 20th") to ` +
      `an absolute YYYY-MM-DD using today's date; use "" when no date is implied.\n\n` +
      `NOTES:\n${notes}`,
  });
  return output;
}
