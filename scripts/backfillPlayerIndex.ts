import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

/**
 * One-time backfill of `player_index` from match history already in the database (TASK-308).
 *
 * The index fills itself from now on — every sync writes its participants — but the matches
 * synced before TASK-308 shipped hold hundreds of thousands of Riot IDs that would otherwise
 * never become searchable. This walks them once.
 *
 *   npm run backfill:player-index          # refuses to run on a non-empty index
 *   npm run backfill:player-index -- --force
 *
 * The guard matters: `indexPlayers` increments an appearance counter, so running this twice over
 * the same matches would double every score and skew the autocomplete ordering.
 */

// Load .env then .env.local so standalone execution picks up DATABASE_URL the same way the Next
// dev server does. Only sets vars not already present, so CI/production env vars win.
function loadEnvFiles(filenames: string[]): void {
  for (const filename of filenames) {
    const filepath = resolve(process.cwd(), filename);
    if (!existsSync(filepath)) continue;
    for (const raw of readFileSync(filepath, "utf-8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const val = line
        .slice(eq + 1)
        .trim()
        .replace(/^["'](.*)["']$/, "$1");
      if (key && !process.env[key]) process.env[key] = val;
    }
  }
}

/** Rows per page. Large enough to keep round trips down, small enough to stay off the heap. */
const BATCH_SIZE = 2000;

async function main(): Promise<void> {
  loadEnvFiles([".env", ".env.local"]);

  // Imported after the env files are read: the service pulls in the Prisma singleton, which
  // reads DATABASE_URL at module load.
  const { indexPlayers } = await import("../src/domains/riot/services/playerIndexService");

  const prisma = new PrismaClient();
  const force = process.argv.includes("--force");

  try {
    const existing = await prisma.playerIndex.count();
    if (existing > 0 && !force) {
      process.stderr.write(
        `player_index already holds ${existing} rows. Re-running would double every appearance ` +
          `count. Pass --force if that is what you want.\n`
      );
      process.exit(1);
    }

    // ── Connected accounts ──────────────────────────────────────────────────
    // First, because they carry a level and profile icon that participant rows do not.
    const accounts = await prisma.riotAccount.findMany({
      select: {
        puuid: true,
        gameName: true,
        tagLine: true,
        region: true,
        profileIconId: true,
        summonerLevel: true,
      },
    });
    const accountsWritten = await indexPlayers(accounts);
    process.stdout.write(`Indexed ${accountsWritten} connected accounts.\n`);

    // ── Match participants ──────────────────────────────────────────────────
    let cursor: string | undefined;
    let scanned = 0;
    let written = 0;

    for (;;) {
      const page = await prisma.matchParticipant.findMany({
        where: { gameName: { not: null } },
        select: {
          id: true,
          puuid: true,
          gameName: true,
          tagLine: true,
          match: { select: { region: true } },
        },
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      if (page.length === 0) break;

      written += await indexPlayers(
        page.map((p) => ({
          puuid: p.puuid,
          gameName: p.gameName,
          tagLine: p.tagLine,
          region: p.match.region,
        }))
      );
      scanned += page.length;
      cursor = page[page.length - 1].id;

      process.stdout.write(`  scanned ${scanned} participants, ${written} index writes\n`);
    }

    const total = await prisma.playerIndex.count();
    process.stdout.write(`Done. player_index holds ${total} players.\n`);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`Backfill failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
