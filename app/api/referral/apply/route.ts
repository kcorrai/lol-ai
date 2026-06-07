import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { applyReferralCode } from "@/domains/identity/services/referralService";

const schema = z.object({ code: z.string().min(1).max(16).toUpperCase() });

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON" } }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } }, { status: 422 });
  }

  const applied = await applyReferralCode(parsed.data.code, userId);
  return apiSuccess({ applied });
});
