// Next.js route handler for POST /api/extract, reached via the web app's
// `/ai-api` dev proxy. A thin HTTP adapter: parses the body against the
// shared ExtractRequest schema and hands it to lib/extraction.ts — all
// prompt/model logic lives there. Path: [this file] → extractItems().
import { ExtractRequest } from "@note2action/shared";
import { extractItems } from "@/lib/extraction";

// Extraction can take a few seconds for long transcripts.
export const maxDuration = 30;

/** Validates the request body (bad shape → 400, not 500), runs extraction. */
export async function POST(req: Request) {
  const parsed = ExtractRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  return Response.json(await extractItems(parsed.data));
}
