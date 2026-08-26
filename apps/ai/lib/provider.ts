/** The one place that knows which LLM backs each ai-app feature — nothing else
 * picks a model directly. Next hop: Anthropic API. */
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/** Chat model for /api/chat — swap via CHAT_MODEL env var; needs ANTHROPIC_API_KEY. */
export function chatModel(): LanguageModel {
  const modelId = process.env.CHAT_MODEL ?? "claude-sonnet-5";
  return anthropic(modelId);
}

/** Model for /api/extract — defaults to Haiku (cheapest/fastest); override via
 * EXTRACT_MODEL. */
export function extractModel(): LanguageModel {
  const modelId = process.env.EXTRACT_MODEL ?? "claude-haiku-4-5";
  return anthropic(modelId);
}
