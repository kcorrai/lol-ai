import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Public endpoint — no auth required.
// Returns all champions (name, key, imageUrl) for use in selectors.
export async function GET() {
  const champions = await prisma.champion.findMany({
    select: { id: true, key: true, name: true, imageUrl: true, roles: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: champions });
}
