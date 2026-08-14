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

/**
 * The model used by /api/extract.
 *
 * Extraction is a mechanical structured-output task, so it defaults to Haiku —
 * the fastest, cheapest tier — rather than the chat model. Haiku also skips the
 * pre-answer "thinking" that Sonnet 5 does by default, which cuts latency.
 * Override with EXTRACT_MODEL to trade speed for quality.
 */
export function extractModel(): LanguageModel {
  const modelId = process.env.EXTRACT_MODEL ?? "claude-haiku-4-5";
  return anthropic(modelId);
}
