// Next.js route handler for POST /api/extract — reached by the web app via
// its `/ai-api` dev proxy (vite.config.ts rewrites /ai-api/* to /api/*).
// A thin HTTP adapter: parses the body against the shared ExtractRequest
// schema, hands it to lib/extraction.ts, and returns the result as-is —
// all the prompt/model logic lives there, not here.
// Path: web capture form → POST /ai-api/extract → [this file] →
// lib/extraction.ts's extractItems().
import { ExtractRequest } from "@note2action/shared";
import { extractItems } from "@/lib/extraction";

// Extraction can take a few seconds for long transcripts.
export const maxDuration = 30;

/** Validates the request body, runs extraction, and returns ExtractResponse. */
export async function POST(req: Request) {
  const request = ExtractRequest.parse(await req.json());
  return Response.json(await extractItems(request));
}
