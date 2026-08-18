import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { isOverlayKeyFormat } from "@/domains/creator/overlayKey";
import { getOverlayPayload } from "@/domains/creator/services/overlayDataService";

export const dynamic = "force-dynamic";

// Returned rather than thrown. `Errors.notFound()` raises an ApiError, and the
// only thing that turns one of those into a response is `withAuth` — which this
// route deliberately does not use, so a thrown error here reaches the client as
// a 500. Verified against a running server before this was written.
function notFound(): Response {
  return apiError("RESOURCE_NOT_FOUND", "Overlay not found", 404);
}

// GET /api/overlay/[key] — no auth. The key is the capability (ADR-026).
//
// Polled by every widget in an OBS scene, so it answers with the whole payload
// rather than a per-widget slice: a four-source scene costs one request.
export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
): Promise<Response> {
  // Shape check before the database: a crawler walking /api/overlay/<anything>
  // should cost a regex, not a query.
  if (!isOverlayKeyFormat(params.key)) return notFound();

  // Keyed on the overlay *and* the caller. Keying on the overlay alone would let
  // anyone who obtained a key exhaust its budget and freeze the creator's own
  // scene; keying on the IP alone would let one creator's overlay eat into a
  // co-streamer's on the same connection.
  const rl = await checkRateLimit(`overlay:${params.key}:${getIp(req)}`, {
    limit: 120,
    windowMs: 60_000,
  });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const result = await getOverlayPayload(params.key);
  // Unknown, disabled and no-linked-account are all this same 404, so a probe
  // cannot learn that a key exists.
  if (!result) return notFound();

  const res = apiSuccess(result.payload);
  // The widget polls, and a cache in between would defeat the delay — which is a
  // correctness property here, not a freshness one.
  res.headers.set("Cache-Control", "no-store");
  // Deliberately readable cross-origin: this is public data behind a capability
  // key, and a creator may want it in their own scene HTML.
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
}
