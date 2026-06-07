import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
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

  if (!recap || !recap.isPublic) throw Errors.notFound("Recap");
  const data = recap.data as Record<string, unknown>;
  return apiSuccess({ ...data, seasonLabel: recap.seasonLabel, generatedAt: recap.generatedAt });
}
