// Streaming chat route for the standalone Module-7 chat demo (app/page.tsx).
// Not part of the main capture flow — the web app never calls this; it's
// reached only by visiting the ai app directly and driven by `useChat` on
// the client, which expects this exact streamed-response shape.
// Path: app/page.tsx's useChat() → [this file] → lib/provider.ts's
// chatModel().
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { chatModel } from "@/lib/provider";

// Allow streamed responses up to 30 seconds.
export const maxDuration = 30;

/**
 * Streams the assistant's reply back as a UI message stream, which
 * `useChat` on the client consumes incrementally.
 */
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
