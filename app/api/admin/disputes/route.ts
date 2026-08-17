import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listDisputes } from "@/domains/marketplace";
import { withAdminAuth } from "@/lib/api/withAdminAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const StatusQuery = z
  .enum(["OPEN", "RESOLVED_REFUND", "RESOLVED_RELEASE", "REJECTED"])
  .default("OPEN");

// GET /api/admin/disputes?status= — oldest first. Somebody is waiting on each.
export const GET = withAdminAuth(async (req: NextRequest): Promise<NextResponse> => {
  const parsed = StatusQuery.safeParse(req.nextUrl.searchParams.get("status") ?? undefined);
  if (!parsed.success) throw Errors.validation("Unknown status.");

  return apiSuccess({ disputes: await listDisputes(parsed.data) });
});
