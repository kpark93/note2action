/** The one place that picks each feature's LLM. Next hop: Anthropic API. */
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/** Model for /api/extract — Haiku by default; override via EXTRACT_MODEL. */
export function extractModel(): LanguageModel {
  const modelId = process.env.EXTRACT_MODEL ?? "claude-haiku-4-5";
  return anthropic(modelId);
}
