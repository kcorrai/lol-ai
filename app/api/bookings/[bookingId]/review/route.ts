import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getReview, saveReview, publishReview } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const ReviewBody = z.object({
  summary: z.string().trim().min(30).max(8000),
  sourceUrl: z.string().url().max(500).nullish(),
  annotations: z
    .array(
      z.object({
        timestampSeconds: z.number().int().min(0).max(36_000),
        title: z.string().trim().min(1).max(120),
        body: z.string().trim().max(2000).default(""),
        category: z.enum([
          "LANING",
          "MACRO",
          "MICRO",
          "VISION",
          "DRAFT",
          "POSITIONING",
          "MENTAL",
        ]),
      })
    )
    .max(60)
    .default([]),
  publish: z.boolean().default(false),
});

// GET /api/bookings/[bookingId]/review — the delivered review, or the coach's draft.
export function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    return apiSuccess({ review: await getReview(params.bookingId, userId) });
  })(req);
}

// PUT /api/bookings/[bookingId]/review — save the draft, optionally publishing it.
export function PUT(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (r, { userId }): Promise<NextResponse> => {
    const parsed = ReviewBody.safeParse(await r.json().catch(() => null));
    if (!parsed.success) {
      throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid review.");
    }

    const saved = await saveReview(params.bookingId, userId, parsed.data);
    if (!saved.ok) throw refusal(saved.reason, saved.detail);

    if (!parsed.data.publish) return apiSuccess({ review: saved.review });

    const published = await publishReview(params.bookingId, userId);
    if (!published.ok) throw refusal(published.reason, published.detail);

    return apiSuccess({ review: published.review });
  })(req);
}

function refusal(reason: string, detail?: string) {
  if (reason === "not-found") return Errors.notFound("Booking");
  if (reason === "forbidden") return Errors.forbidden("Only the coach writes this review.");
  if (reason === "wrong-kind") return Errors.conflict("This session is not a replay review.");
  return Errors.validation(detail ?? "That review is not valid.");
}
