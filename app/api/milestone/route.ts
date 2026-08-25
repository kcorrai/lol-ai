import { type NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { listAccounts } from "@/domains/riot/services/accountService";
import { getMonthlyMilestone } from "@/domains/analysis/services/milestoneService";

export const dynamic = "force-dynamic";

// Read-only and owner-scoped — it resolves the caller's own primary account and reads a
// month back out of it — so the desktop window may ask for it too (ADR-038).
export const GET = withAuth(
  async (req: NextRequest, ctx: { userId: string }) => {
    const now = new Date();
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(now.getFullYear()), 10);
    const month = parseInt(req.nextUrl.searchParams.get("month") ?? String(now.getMonth() + 1), 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw Errors.validation("Invalid year or month");
    }

    const accounts = await listAccounts(ctx.userId);
    const account = accounts.find((a) => a.isPrimary) ?? accounts[0];
    if (!account) throw Errors.notFound("Riot account");

    const data = await getMonthlyMilestone(account.id, year, month);
    return apiSuccess(data);
  },
  { deviceAccess: true }
);
