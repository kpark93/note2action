import { ExtractRequest } from "@note2action/shared";
import { extractItems } from "@/lib/extraction";

// Extraction can take a few seconds for long transcripts.
export const maxDuration = 30;

export async function POST(req: Request) {
  const request = ExtractRequest.parse(await req.json());
  return Response.json(await extractItems(request));
}
