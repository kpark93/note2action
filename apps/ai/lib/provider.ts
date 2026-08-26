// The one place that knows which LLM backs each ai-app feature.
// Called by lib/extraction.ts (extractModel) and api/chat/route.ts
// (chatModel); nothing else picks a model directly.
// Path: extract/route.ts or chat/route.ts → [this file] → Anthropic API.
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * Chat model for /api/chat. Swap via CHAT_MODEL env var, or a different
 * `@ai-sdk/*` provider; reads ANTHROPIC_API_KEY (see .env.example).
 */
export function chatModel(): LanguageModel {
  const modelId = process.env.CHAT_MODEL ?? "claude-sonnet-5";
  return anthropic(modelId);
}

/**
 * Model for /api/extract — defaults to Haiku (cheapest/fastest, skips
 * Sonnet's pre-answer "thinking"). Override via EXTRACT_MODEL.
 */
export function extractModel(): LanguageModel {
  const modelId = process.env.EXTRACT_MODEL ?? "claude-haiku-4-5";
  return anthropic(modelId);
}
