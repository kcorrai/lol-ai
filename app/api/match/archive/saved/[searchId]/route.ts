import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { deleteSavedSearch } from "@/domains/match/services/savedSearchService";

export const dynamic = "force-dynamic";

// DELETE /api/match/archive/saved/[searchId]
export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const searchId = req.nextUrl.pathname.split("/").at(-1) ?? "";
  if (!searchId) throw Errors.validation("Missing searchId");

  // Ownership is enforced inside the delete itself — a search belonging to someone else is
  // indistinguishable from one that does not exist, which is the answer we want to give.
  await deleteSavedSearch(userId, searchId);
  return apiSuccess({ deleted: true });
});
