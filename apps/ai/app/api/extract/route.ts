/** POST /api/extract — thin HTTP adapter: validates the body against the shared
 * ExtractRequest schema, then hands off to lib/extraction.ts `extractItems()`. */
import { ExtractRequest } from "@note2action/shared";
import { extractItems } from "@/lib/extraction";

/** Extraction can take a few seconds for long transcripts. */
export const maxDuration = 30;

/** Validates the request body (bad shape → 400, not 500), runs extraction. */
export async function POST(req: Request) {
  const parsed = ExtractRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  return Response.json(await extractItems(parsed.data));
}
