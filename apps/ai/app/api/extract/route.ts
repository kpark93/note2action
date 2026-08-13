import { generateObject } from "ai";
import { chatModel } from "@/lib/provider";
import { ExtractRequest, ExtractResponse } from "@note2action/shared";

// Extraction can take a few seconds for long transcripts.
export const maxDuration = 30;

export async function POST(req: Request) {
  const { notes, meetingTitle, today, owners } = ExtractRequest.parse(
    await req.json(),
  );

  // `generateObject` constrains the model to the ExtractResponse schema and
  // validates the result, so the caller always gets well-formed items back.
  const { object } = await generateObject({
    model: chatModel(),
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

  return Response.json(object);
}
