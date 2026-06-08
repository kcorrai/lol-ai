import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { toProfileSlug } from "@/domains/identity/services/profileService";

// POST /api/admin/backfill-slugs
// Sets profileSlug for all users who have a primary Riot account but no slug yet.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  const session = isCronAuth ? null : await getServerSession(authOptions);

  if (!isCronAuth) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const usersWithoutSlug = await prisma.user.findMany({
    where: {
      profileSlug: null,
      riotAccounts: { some: { isPrimary: true } },
    },
    select: {
      id: true,
      riotAccounts: {
        where: { isPrimary: true },
        select: { gameName: true, tagLine: true },
        take: 1,
      },
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const user of usersWithoutSlug) {
    const account = user.riotAccounts[0];
    if (!account) { skipped++; continue; }

    const slug = toProfileSlug(account.gameName, account.tagLine);

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { profileSlug: slug },
      });
      updated++;
    } catch {
      // unique constraint — another user already has this slug
      skipped++;
    }
  }

  return NextResponse.json({ updated, skipped, total: usersWithoutSlug.length });
}
