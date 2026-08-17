import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listApplications, pendingCount } from "@/domains/marketplace";
import { withAdminAuth } from "@/lib/api/withAdminAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const StatusQuery = z
  .enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"])
  .default("PENDING");

// GET /api/admin/coaches?status= — the review queue, oldest first.
export const GET = withAdminAuth(async (req: NextRequest): Promise<NextResponse> => {
  const parsed = StatusQuery.safeParse(req.nextUrl.searchParams.get("status") ?? undefined);
  if (!parsed.success) throw Errors.validation("Unknown status.");

  const [applications, pending] = await Promise.all([
    listApplications(parsed.data),
    pendingCount(),
  ]);

  return apiSuccess({ applications, pending });
});
