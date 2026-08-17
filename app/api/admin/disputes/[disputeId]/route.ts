import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveDispute } from "@/domains/marketplace";
import { withAdminAuth } from "@/lib/api/withAdminAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const Body = z.object({
  outcome: z.enum(["refund", "release"]),
  // Required, and it is what the losing side is told. A decision nobody can
  // reconstruct is the complaint this whole section exists to avoid making.
  note: z.string().trim().min(20).max(2000),
});

// PATCH /api/admin/disputes/[disputeId] — settle it one way or the other.
export function PATCH(
  req: NextRequest,
  { params }: { params: { disputeId: string } }
): Promise<NextResponse> {
  return withAdminAuth(async (r, { adminId }): Promise<NextResponse> => {
    const parsed = Body.safeParse(await r.json().catch(() => null));
    if (!parsed.success) throw Errors.validation("A decision and a reason are required.");

    const result = await resolveDispute(
      params.disputeId,
      adminId,
      parsed.data.outcome,
      parsed.data.note
    );

    if (!result.ok) {
      if (result.reason === "not-found") throw Errors.notFound("Dispute");
      throw Errors.conflict("This dispute has already been settled.");
    }

    return apiSuccess({ resolved: parsed.data.outcome });
  })(req);
}
