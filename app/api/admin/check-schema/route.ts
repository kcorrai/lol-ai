import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Temporary diagnostic — DELETE after confirming DB state.
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'coaching_reports'
    ORDER BY ordinal_position
  `;

  return NextResponse.json({ columns: cols.map((c) => c.column_name) });
};
