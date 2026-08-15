import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import type { ServiceResult } from "@/domains/draft/server";

// A draft room is the app's first genuinely public write surface, so the limits
// are per IP and deliberately tight on creation. The read limit allows the 1 Hz
// poll from ADR-016 plus headroom for a few tabs behind one NAT.
export const CREATE_LIMIT = { limit: 5, windowMs: 10 * 60_000 };
export const MUTATION_LIMIT = { limit: 60, windowMs: 60_000 };
export const READ_LIMIT = { limit: 240, windowMs: 60_000 };

// Freshness is the entire point of these responses; nothing may cache them.
const NO_STORE = "no-store";

export const mutationBody = z.object({
  token: z.string().min(1).max(128),
  gameNumber: z.number().int().min(1).max(5),
});

const STATUS_CODES: Record<number, string> = {
  403: "FORBIDDEN",
  404: "RESOURCE_NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_ERROR",
};

/** Turns a service outcome into the API envelope, carrying the engine's reason
 *  string through so the room can show a real message rather than "failed". */
export function serviceResponse(result: ServiceResult): NextResponse {
  const res = result.ok
    ? // `serverTime` lets the client correct for clock skew before deriving the
      // countdown from `turnStartedAt`. Without it a machine running 30 seconds
      // fast shows every turn as already expired (ADR-016 §4).
      apiSuccess({ state: result.state, role: result.role, serverTime: new Date().toISOString() })
    : apiError(STATUS_CODES[result.status] ?? "INTERNAL_ERROR", result.reason, result.status);
  res.headers.set("Cache-Control", NO_STORE);
  return res;
}

export function validationError(message: string): NextResponse {
  const res = apiError("VALIDATION_ERROR", message, 422);
  res.headers.set("Cache-Control", NO_STORE);
  return res;
}

/**
 * Rate limit, parse, delegate. Every mutation route is three lines on top of
 * this, which is what keeps handlers inside the 80-line budget in CLAUDE.md §3.3.
 */
export async function handleMutation<T extends z.ZodType>(
  req: NextRequest,
  schema: T,
  run: (body: z.infer<T>) => Promise<ServiceResult>
): Promise<NextResponse> {
  const rl = await checkRateLimit(`draft-mutate:${getIp(req)}`, MUTATION_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return validationError("Request body must be JSON");
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid request body");
  }

  return serviceResponse(await run(parsed.data));
}
