/** Streaming chat route for the standalone Module-7 chat demo — only page.tsx's
 * `useChat` calls this. Next hop: lib/provider.ts `chatModel()`. */
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { chatModel } from "@/lib/provider";

/** Allow streamed responses up to 30 seconds. */
export const maxDuration = 30;

/** Streams the reply as a UI message stream that `useChat` consumes incrementally. */
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: chatModel(),
    system:
      "You are note2action's assistant. Help the user turn rough notes into " +
      "clear, actionable to-do items. Be concise.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
