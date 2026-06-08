import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

async function assertAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const session = await getServerSession(authOptions);
  return !!(adminEmail && session?.user?.email === adminEmail);
}

const createSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+$/),
  description: z.string().default(""),
  enabled: z.boolean().default(false),
  rolloutPercentage: z.number().int().min(0).max(100).default(100),
  userSegment: z.array(z.string()).default(["all"]),
});

const updateSchema = createSchema.partial().extend({ id: z.string().uuid() });

export async function GET(): Promise<NextResponse> {
  if (!await assertAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const flags = await prisma.featureFlag.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: flags });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!await assertAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const flag = await prisma.featureFlag.create({ data: parsed.data });
  return NextResponse.json({ data: flag }, { status: 201 });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!await assertAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { id, ...data } = parsed.data;
  const flag = await prisma.featureFlag.update({ where: { id }, data });
  return NextResponse.json({ data: flag });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  if (!await assertAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.featureFlag.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
