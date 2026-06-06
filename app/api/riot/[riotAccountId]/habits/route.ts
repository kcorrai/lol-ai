import { withAuth } from "@/lib/api/withAuth";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getActiveHabits, detectAndPersistHabits } from "@/domains/analysis/services/habitDetectionService";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/riot/[riotAccountId]/habits
// Returns active (unresolved) habits for the given account.
// Also triggers a re-detection pass so the data stays fresh on page load.
export const GET = withAuth(async (req, { userId }) => {
  const riotAccountId = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!riotAccountId) return apiError("BAD_REQUEST", "Missing riotAccountId", 400);

  try {
    await assertOwnsRiotAccount(userId, riotAccountId);
  } catch {
    return apiError("FORBIDDEN", "Forbidden", 403);
  }

  // Non-blocking detection — return cached habits immediately, upsert in background.
  void detectAndPersistHabits(riotAccountId).catch(() => {});

  const habits = await getActiveHabits(riotAccountId);
  return apiSuccess({ habits });
});
