/** GET /api/health — liveness for the ALB target group; no dependencies. */
export function GET(): Response {
  return Response.json({ status: "ok" });
}
