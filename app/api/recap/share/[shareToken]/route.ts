import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/recap/share/[shareToken] — public, no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: { shareToken: string } }
): Promise<Response> {
  const recap = await prisma.seasonRecap.findUnique({
    where: { shareToken: params.shareToken },
    select: { data: true, seasonLabel: true, generatedAt: true, isPublic: true },
  });

  // Returned, not thrown: this route has no `withAuth` to catch an ApiError, so the
  // throw surfaced as a 500. A recap that was never shared and one that does not exist
  // answer the same way, so a token cannot be probed for existence.
  if (!recap || !recap.isPublic) return apiError("RESOURCE_NOT_FOUND", "Recap not found", 404);
  const data = recap.data as Record<string, unknown>;
  return apiSuccess({ ...data, seasonLabel: recap.seasonLabel, generatedAt: recap.generatedAt });
}
