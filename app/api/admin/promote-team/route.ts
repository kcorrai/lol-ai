import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkCronAuth } from "@/lib/api/cronAuth";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

// Grants the paid `team` plan, so it accepts two callers: an ADMIN_EMAIL session, or the scheduler
// holding CRON_SECRET. It cannot go through `withAdminAuth`, which only knows the session path —
// hence the local check rather than the shared wrapper.
const bodySchema = z.object({ email: z.string().email().optional() });

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Constant-time, and shared with the scheduled endpoints: a `===` on a bearer token
  // returns at the first differing byte, which an attacker can retry against for free.
  const isCronAuth = checkCronAuth(req).ok;

  const session = isCronAuth ? null : await getServerSession(authOptions);

  if (!isCronAuth) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
      return apiError("FORBIDDEN", "Admin access required", 403);
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Was unguarded — a malformed body threw straight out of the handler.
    return apiError("VALIDATION_ERROR", "Invalid JSON body", 422);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 422);

  const targetEmail = parsed.data.email ?? session?.user?.email;
  if (!targetEmail) return apiError("VALIDATION_ERROR", "email required", 422);

  try {
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true },
    });

    if (!user) return apiError("RESOURCE_NOT_FOUND", "User not found", 404);

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { plan: "team", status: "active" },
      create: { userId: user.id, plan: "team", status: "active" },
    });

    return apiSuccess({ email: targetEmail, plan: "team" });
  } catch (err) {
    // Was returned to the caller verbatim, which leaks database internals on an unexpected failure.
    logger.error("[promote-team] Failed to grant the team plan", err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
