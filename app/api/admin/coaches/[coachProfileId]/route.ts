import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  approveApplication,
  rejectApplication,
  suspendCoach,
  reinstateCoach,
} from "@/domains/marketplace";
import { withAdminAuth } from "@/lib/api/withAdminAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// Every decision except approval carries a note, and it is required rather than
// optional: being told nothing is the complaint every rejected applicant on
// every one of these platforms has, and it is what makes a second application
// worth reading.
const DecisionBody = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve") }),
  z.object({ decision: z.literal("reject"), note: z.string().trim().min(10).max(1000) }),
  z.object({ decision: z.literal("suspend"), note: z.string().trim().min(10).max(1000) }),
  z.object({ decision: z.literal("reinstate"), note: z.string().trim().min(10).max(1000) }),
]);

// PATCH /api/admin/coaches/[coachProfileId] — decide on one coach.
export function PATCH(
  req: NextRequest,
  { params }: { params: { coachProfileId: string } }
): Promise<NextResponse> {
  return withAdminAuth(async (r, { adminId }): Promise<NextResponse> => {
    const parsed = DecisionBody.safeParse(await r.json().catch(() => null));
    if (!parsed.success) {
      throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid decision.");
    }

    const id = params.coachProfileId;
    const body = parsed.data;
    const result =
      body.decision === "approve"
        ? await approveApplication(id, adminId)
        : body.decision === "reject"
          ? await rejectApplication(id, adminId, body.note)
          : body.decision === "suspend"
            ? await suspendCoach(id, adminId, body.note)
            : await reinstateCoach(id, adminId, body.note);

    if (!result.ok) {
      if (result.reason === "not-found") throw Errors.notFound("Coach profile");
      throw Errors.conflict("This coach is not in a state that decision applies to.");
    }

    return apiSuccess({ decided: body.decision, slug: result.slug });
  })(req);
}
