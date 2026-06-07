import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

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

  const body = await req.json() as { email?: string };
  const targetEmail = body.email ?? session?.user?.email;

  if (!targetEmail) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: { plan: "team", status: "active" },
    create: { userId: user.id, plan: "team", status: "active" },
  });

  return NextResponse.json({ ok: true, email: targetEmail, plan: "team" });
}
