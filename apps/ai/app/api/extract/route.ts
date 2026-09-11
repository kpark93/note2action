/** POST /api/extract: verify the Clerk token, validate the body, hand off to extractItems(). */
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
  try {
    return Response.json(await extractItems(parsed.data));
  } catch (error) {
    // Provider/model failures are upstream trouble, not a bug here: 502.
    console.error("extraction failed:", error);
    return Response.json({ error: "Extraction failed" }, { status: 502 });
  }
}
