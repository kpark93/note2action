/** Streaming chat route for the standalone Module-7 chat demo — only page.tsx's
 * `useChat` calls this. Next hop: lib/provider.ts `chatModel()`. */
import { convertToModelMessages, safeValidateUIMessages, streamText } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/provider";
import { verifyRequest } from "@/lib/auth";

/** Allow streamed responses up to 30 seconds. */
export const maxDuration = 30;

/** Body shell: message internals are checked by `safeValidateUIMessages`. */
const ChatRequest = z.object({ messages: z.array(z.unknown()).min(1) });

/** Verifies identity (401), validates the body (400), streams the reply as a
 * UI message stream that `useChat` consumes incrementally. */
export async function POST(req: Request) {
  if (!(await verifyRequest(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = ChatRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const validated = await safeValidateUIMessages({
    messages: parsed.data.messages,
  });
  if (!validated.success) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  const result = streamText({
    model: chatModel(),
    system:
      "You are note2action's assistant. Help the user turn rough notes into " +
      "clear, actionable to-do items. Be concise.",
    messages: await convertToModelMessages(validated.data),
  });

  return result.toUIMessageStreamResponse();
}
