import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// One-time migration fix — DELETE THIS FILE after the column is confirmed in production.
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$executeRaw`ALTER TABLE "coaching_reports" ADD COLUMN IF NOT EXISTS "focus_area" TEXT`;

  return NextResponse.json({ ok: true, message: "focus_area column ensured" });
};
