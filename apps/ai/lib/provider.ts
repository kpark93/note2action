import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * The chat model used by /api/chat.
 *
 * Provider is swappable: change the default model id via the CHAT_MODEL env var,
 * or replace this module with a different `@ai-sdk/*` provider (e.g. openai).
 * The Anthropic provider reads ANTHROPIC_API_KEY from the environment — see
 * .env.example.
 */
export function chatModel(): LanguageModel {
  const modelId = process.env.CHAT_MODEL ?? "claude-sonnet-5";
  return anthropic(modelId);
}
