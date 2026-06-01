import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { listAccounts } from "@/domains/riot/services/accountService";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const accounts = await listAccounts(userId);
  return apiSuccess(accounts);
});
