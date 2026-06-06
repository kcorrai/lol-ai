import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Temporary fix — renames focus_area → focusArea and deletes itself after confirmation.
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRaw`ALTER TABLE "coaching_reports" RENAME COLUMN "focus_area" TO "focusArea"`;

  return NextResponse.json({ ok: true, message: "Renamed focus_area → focusArea" });
};
