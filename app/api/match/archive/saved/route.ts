import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { archiveFilterSchema } from "@/domains/match/services/matchArchiveFilters";
import { listSavedSearches, saveSearch } from "@/domains/match/services/savedSearchService";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(60),
  filters: archiveFilterSchema,
});

// GET /api/match/archive/saved — the player's saved filter sets.
export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  return apiSuccess({ searches: await listSavedSearches(userId) });
});

// POST /api/match/archive/saved — save a filter set under a name, replacing one of the same name.
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation("Invalid saved search");

  const saved = await saveSearch(userId, parsed.data.name, parsed.data.filters);
  return apiSuccess({ search: saved }, 201);
});
