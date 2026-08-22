// Next.js route handler for POST /api/extract, reached via the web app's
// `/ai-api` dev proxy. A thin HTTP adapter: parses the body against the
// shared ExtractRequest schema and hands it to lib/extraction.ts — all
// prompt/model logic lives there. Path: [this file] → extractItems().
import { ExtractRequest } from "@note2action/shared";
import { extractItems } from "@/lib/extraction";

// Extraction can take a few seconds for long transcripts.
export const maxDuration = 30;

/** Validates the request body, runs extraction, and returns ExtractResponse. */
export async function POST(req: Request) {
  const request = ExtractRequest.parse(await req.json());
  return Response.json(await extractItems(request));
}
