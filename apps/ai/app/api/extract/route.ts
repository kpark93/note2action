/** POST /api/extract — thin HTTP adapter: verifies the Clerk token, validates
 * the body against the shared ExtractRequest schema, then hands off to
 * lib/extraction.ts `extractItems()`. */
import { ExtractRequest } from "@note2action/shared";
import { extractItems } from "@/lib/extraction";
import { verifyRequest } from "@/lib/auth";

/** Extraction can take a few seconds for long transcripts. */
export const maxDuration = 30;

/** Verifies identity (401), validates the body (400, not 500), runs extraction. */
export async function POST(req: Request) {
  if (!(await verifyRequest(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = ExtractRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  return Response.json(await extractItems(parsed.data));
}
