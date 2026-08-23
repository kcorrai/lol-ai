import { readdirSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { loadEnvFiles } from "./loadEnv";
import { compareMigrations, isInSync } from "../src/lib/db/migrationDrift";

/**
 * Runs as `predev`, so `npm run dev` cannot quietly start against the wrong database.
 *
 * The failure this exists for: `DATABASE_URL` names `localhost:5432`, never *which* Postgres
 * cluster is listening there. This machine has carried three clusters each holding a `lolai_dev`,
 * all three left on the default port, and starting a different one swaps the entire database out
 * without a single query failing — the app just reads data that is weeks old. It went unexplained
 * three times (LA-39, LA-40, LA-65) because nothing ever contradicted the connection.
 *
 * Two contradictions are checked, cheapest first:
 *
 *   1. The cluster's `system_identifier` — stamped once by `initdb` and unique per cluster, which
 *      makes it the one value that says *which Postgres this is*. Readable by an ordinary role,
 *      unlike `data_directory`. Only checked when `EXPECTED_PG_SYSTEM_ID` is set, so it costs
 *      nothing in CI or for anyone who has not pinned one.
 *   2. Migration drift. Needs no configuration: migrations this checkout has that the database
 *      has never seen — or the reverse — mean the two are not the pair they should be.
 *
 * A database that cannot be reached is *not* an error here. Working on the frontend with Postgres
 * down is ordinary; only a reachable database that disagrees stops the dev server.
 *
 *   SKIP_DB_PREFLIGHT=1 npm run dev    # go anyway
 */

const MIGRATIONS_DIR = resolve(process.cwd(), "prisma", "migrations");

/** Migration names printed per direction before the rest becomes a count. */
const SHOWN = 5;

interface ClusterIdentity {
  systemId: string | null;
  startedAt: Date | null;
}

function migrationsOnDisk(): string[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * `_prisma_migrations` is Prisma's own bookkeeping and is deliberately absent from
 * `schema.prisma`, so there is no model to read it through — the documented raw query CLAUDE.md
 * §2.1 asks for rather than an unreviewed one.
 *
 * `finished_at IS NOT NULL AND rolled_back_at IS NULL` is the condition `prisma migrate status`
 * treats as applied: a half-finished or rolled-back row never shaped the schema.
 */
async function appliedMigrations(prisma: PrismaClient): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name
    FROM _prisma_migrations
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
  `;
  return rows.map((row) => row.migration_name);
}

/** Both readable by a plain role, but either can be refused — so neither is relied on. */
async function clusterIdentity(prisma: PrismaClient): Promise<ClusterIdentity> {
  const systemId = await prisma.$queryRaw<
    { system_identifier: bigint }[]
  >`SELECT system_identifier FROM pg_control_system()`
    .then((rows) => (rows[0] ? rows[0].system_identifier.toString() : null))
    .catch(() => null);

  const startedAt = await prisma.$queryRaw<{ t: Date }[]>`SELECT pg_postmaster_start_time() AS t`
    .then((rows) => rows[0]?.t ?? null)
    .catch(() => null);

  return { systemId, startedAt };
}

function describe(identity: ClusterIdentity): string {
  const parts: string[] = [];
  if (identity.systemId) parts.push(`cluster ${identity.systemId}`);
  if (identity.startedAt) parts.push(`up since ${identity.startedAt.toISOString()}`);
  return parts.join(", ");
}

function fail(lines: string[]): never {
  process.stderr.write(`\n${lines.join("\n")}\n\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  if (process.env.SKIP_DB_PREFLIGHT === "1") return;

  loadEnvFiles();
  const prisma = new PrismaClient();

  let applied: string[];
  try {
    applied = await appliedMigrations(prisma);
  } catch (error) {
    // Unreachable, or reachable with no `_prisma_migrations` yet. Prisma pads these errors with
    // blank lines and a banner and moves the real cause between versions, so show the first few
    // non-empty lines rather than guessing which one matters.
    const detail = (error instanceof Error ? error.message : String(error))
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 4);
    process.stdout.write(
      [
        "› database preflight skipped — could not read the migration table.",
        ...detail.map((line) => `  ${line}`),
        "  Starting the dev server anyway; pages that need data will fail until it is up.",
        "",
      ].join("\n")
    );
    await prisma.$disconnect();
    return;
  }

  const identity = await clusterIdentity(prisma);
  await prisma.$disconnect();

  const expected = process.env.EXPECTED_PG_SYSTEM_ID?.trim();
  if (expected && identity.systemId && identity.systemId !== expected) {
    fail([
      "✗ This is not the Postgres cluster you pinned.",
      "",
      `  EXPECTED_PG_SYSTEM_ID  ${expected}`,
      `  answering on 5432      ${identity.systemId}`,
      ...(identity.startedAt
        ? [`  that one came up at    ${identity.startedAt.toISOString()}`]
        : []),
      "",
      "  A different cluster has taken the port. Every query will still succeed, against a",
      "  different copy of the database — this is exactly what LA-39, LA-40 and LA-65 were.",
      "  Stop it and start the one you meant, naming its -D explicitly.",
      "",
      "  To start the dev server regardless: SKIP_DB_PREFLIGHT=1 npm run dev",
    ]);
  }

  const drift = compareMigrations(migrationsOnDisk(), applied);
  if (isInSync(drift)) {
    const suffix = describe(identity);
    process.stdout.write(
      `› database preflight ok — ${applied.length} migrations${suffix ? `, ${suffix}` : ""}\n`
    );
    return;
  }

  const lines = ["✗ The database does not match this checkout."];
  const listing = (heading: string, names: string[]): void => {
    if (names.length === 0) return;
    lines.push("", `  ${heading} (${names.length}):`);
    // A freshly created database is behind by every migration there has ever been, and sixty
    // names buries the two lines underneath that say what to do about it. The count above is
    // the whole number either way.
    for (const name of names.slice(0, SHOWN)) lines.push(`    - ${name}`);
    if (names.length > SHOWN) lines.push(`    … and ${names.length - SHOWN} more`);
  };
  listing("In prisma/migrations, never applied there", drift.missing);
  listing("Applied there, unknown to this checkout", drift.unknown);
  lines.push(
    "",
    describe(identity)
      ? `  Answering on this connection: ${describe(identity)}`
      : "  This role may not read the cluster's identity, so which Postgres answered is unknown.",
    "",
    "  Migrations only in this checkout are the ordinary case: npm run db:migrate:dev",
    "  Migrations only in the database mean it is a different database — most likely another",
    "  cluster has taken port 5432. Pin the right one with EXPECTED_PG_SYSTEM_ID (.env.example).",
    "",
    "  To start the dev server regardless: SKIP_DB_PREFLIGHT=1 npm run dev"
  );
  fail(lines);
}

main().catch((error) => {
  // A fault in the check itself must never become a wall in front of the dev server.
  const detail = error instanceof Error ? error.message : String(error);
  process.stdout.write(`› database preflight could not run: ${detail}\n`);
});
