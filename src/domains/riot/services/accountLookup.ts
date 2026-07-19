import { prisma } from "@/lib/db/prisma";

// Resolves a Riot account row to its puuid. Match data is queried by puuid (not riotAccountId) so
// that every user who has linked the same Riot account sees the same matches (TASK-228).
export async function getAccountPuuid(riotAccountId: string): Promise<string | null> {
  // `?.` guards the account being absent (invalid id) — callers fall back to an empty puuid filter,
  // which safely matches no rows.
  const account = await prisma.riotAccount?.findUnique({
    where: { id: riotAccountId },
    select: { puuid: true },
  });
  return account?.puuid ?? null;
}
