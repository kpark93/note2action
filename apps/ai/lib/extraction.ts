/** Extraction prompt + model call. Next hop: provider.ts extractModel() → Anthropic API. */
import { generateText, Output } from "ai";
import { ExtractResponse, type ExtractRequest } from "@note2action/shared";
import { extractModel } from "@/lib/provider";

/** generateText + Output.object(ExtractResponse); .describe()s double as instructions. */
export async function extractItems(
  request: ExtractRequest,
): Promise<ExtractResponse> {
  const { notes, meetingTitle, today } = request;
  const { output } = await generateText({
    model: extractModel(),
    // Input is capped at 20k chars (schema); this bounds the spend side.
    maxOutputTokens: 4096,
    output: Output.object({ schema: ExtractResponse }),
    system:
      "You are note2action's extraction engine. Read raw meeting notes and " +
      "return only concrete, actionable to-do items. Infer each item's owner, " +
      "priority, and due date. Never invent tasks that the notes don't imply.",
    prompt:
      `Today is ${today}. Meeting: "${meetingTitle}".\n` +
      `Name each item's owner exactly as the notes name them; use "Unassigned" ` +
      `when nobody is clearly on the hook.\n` +
      `Resolve relative dates (e.g. "next week", "Friday", "before the 20th") to ` +
      `an absolute YYYY-MM-DD using today's date; use "" when no date is implied.\n\n` +
      `NOTES:\n${notes}`,
  });
  return output;
}
