import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import { assertCanAddRiotAccount, checkIsPro } from "@/lib/auth/authorization";
import { backgroundRefresh } from "@/lib/riot/lifecycle";
import {
  getAccountByRiotId,
  getSummonerByPuuid,
  VALID_REGIONS,
} from "@/domains/riot/services/riotApiClient";
import { syncAccount } from "@/domains/riot/services/matchSyncService";
import type { ApiError } from "@/lib/api/errors";

export type ConnectedAccount = {
  id: string;
  gameName: string;
  tagLine: string;
  region: string;
  summonerLevel: number;
  profileIconId: number;
  isPrimary: boolean;
  lastSyncedAt: Date | null;
};

// Strip Unicode directional formatting characters that some browsers inject
// into form inputs (e.g. U+2066 LTR Isolate added by Turkish locale in Opera/Chrome)
function sanitizeRiotIdPart(s: string): string {
  return s.replace(/[⁦-⁩‎‏‪-‮]/g, "").trim();
}

export async function connectAccount(
  userId: string,
  gameName: string,
  tagLine: string,
  region: string
): Promise<ConnectedAccount> {
  const cleanGameName = sanitizeRiotIdPart(gameName);
  const cleanTagLine = sanitizeRiotIdPart(tagLine);

  if (!VALID_REGIONS.includes(region)) {
    throw Errors.validation(`Invalid region "${region}"`);
  }

  await assertCanAddRiotAccount(userId);

  // Resolve PUUID from Riot ID — throws RIOT_NOT_FOUND on 404
  const riotAccountDto = await getAccountByRiotId(cleanGameName, cleanTagLine, region).catch(
    (err: ApiError) => {
      if (err.code === "RIOT_NOT_FOUND") {
        throw Errors.notFound("Riot ID");
      }
      throw err;
    }
  );

  // Check if this user already has this account linked
  const ownExisting = await prisma.riotAccount.findFirst({
    where: { puuid: riotAccountDto.puuid, userId },
  });
  if (ownExisting) {
    throw Errors.conflict("This Riot account is already connected to your profile.");
  }

  // Free plan users cannot link an account already claimed by another user
  const isPro = await checkIsPro(userId);
  if (!isPro) {
    const otherExisting = await prisma.riotAccount.findFirst({
      where: { puuid: riotAccountDto.puuid, userId: { not: userId } },
    });
    if (otherExisting) {
      throw Errors.conflict("This Riot account is already connected to another user.");
    }
  }

  // Fetch full summoner data
  const summoner = await getSummonerByPuuid(riotAccountDto.puuid, region);

  const isPrimary =
    (await prisma.riotAccount.count({ where: { userId } })) === 0;

  const account = await prisma.riotAccount.create({
    data: {
      userId,
      puuid: riotAccountDto.puuid,
      summonerId: summoner.id,
      accountId: summoner.accountId,
      gameName: riotAccountDto.gameName,
      tagLine: riotAccountDto.tagLine,
      summonerLevel: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
      region,
      isPrimary,
    },
  });

  // Set profile slug from first primary account (non-blocking)
  if (isPrimary) {
    const { ensureProfileSlug } = await import("@/domains/identity/services/profileService");
    ensureProfileSlug(userId, account.gameName, account.tagLine).catch(() => undefined);
  }

  // Kick off initial sync without blocking the response
  backgroundRefresh(() => syncAccount(account.id).then(() => undefined));

  return {
    id: account.id,
    gameName: account.gameName,
    tagLine: account.tagLine,
    region: account.region,
    summonerLevel: account.summonerLevel,
    profileIconId: account.profileIconId,
    isPrimary: account.isPrimary,
    lastSyncedAt: account.lastSyncedAt,
  };
}

export async function disconnectAccount(
  userId: string,
  riotAccountId: string
): Promise<void> {
  const account = await prisma.riotAccount.findFirst({
    where: { id: riotAccountId, userId },
  });
  if (!account) throw Errors.notFound("Riot account");

  // Hard delete the account — match data is preserved via cascade null on participants
  await prisma.riotAccount.delete({ where: { id: riotAccountId } });

  // If the deleted account was primary, promote another one
  if (account.isPrimary) {
    const next = await prisma.riotAccount.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.riotAccount.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }
}

export async function setPrimaryAccount(
  userId: string,
  riotAccountId: string
): Promise<void> {
  const account = await prisma.riotAccount.findFirst({
    where: { id: riotAccountId, userId },
    select: { id: true },
  });
  if (!account) throw Errors.notFound("Riot account");

  await prisma.$transaction([
    prisma.riotAccount.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.riotAccount.update({
      where: { id: riotAccountId },
      data: { isPrimary: true },
    }),
  ]);
}

export async function listAccounts(userId: string): Promise<ConnectedAccount[]> {
  const accounts = await prisma.riotAccount.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  return accounts.map((a) => ({
    id: a.id,
    gameName: a.gameName,
    tagLine: a.tagLine,
    region: a.region,
    summonerLevel: a.summonerLevel,
    profileIconId: a.profileIconId,
    isPrimary: a.isPrimary,
    lastSyncedAt: a.lastSyncedAt,
  }));
}
