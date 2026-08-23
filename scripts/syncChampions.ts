import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

// Load .env then .env.local so standalone execution (tsx scripts/...) picks up
// DATABASE_URL the same way Next.js dev server does. Only sets vars not already
// present in the process environment, so CI/production env vars win.
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

// ── Data Dragon Types ─────────────────────────────────────────────────────────

interface DDragonChampionImage {
  full: string;
}

interface DDragonChampionInfo {
  difficulty: number;
}

interface DDragonChampionData {
  id: string;
  key: string;
  name: string;
  title: string;
  image: DDragonChampionImage;
  tags: string[];
  info: DDragonChampionInfo;
}

interface DDragonChampionResponse {
  version: string;
  data: Record<string, DDragonChampionData>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DDRAGON = "https://ddragon.leagueoflegends.com";
const LOCALE = "en_US";
const FETCH_TIMEOUT_MS = 15_000;

// ── Network helpers ───────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS}ms: ${url}`);
    }
    throw new Error(
      `Network failure fetching ${url}: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  }

  return res.json() as Promise<T>;
}

async function fetchLatestVersion(): Promise<string> {
  const versions = await fetchJson<string[]>(`${DDRAGON}/api/versions.json`);
  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error("Data Dragon returned an empty or invalid versions list");
  }
  return versions[0];
}

async function fetchChampionMap(version: string): Promise<DDragonChampionResponse> {
  const url = `${DDRAGON}/cdn/${version}/data/${LOCALE}/champion.json`;
  const payload = await fetchJson<DDragonChampionResponse>(url);
  if (!payload.data || typeof payload.data !== "object") {
    throw new Error(`Unexpected champion.json shape from Data Dragon (version ${version})`);
  }
  return payload;
}

// ── Core sync function (exported for use in seed.ts) ─────────────────────────

export async function syncChampions(prisma: PrismaClient): Promise<void> {
  const version = await fetchLatestVersion();
  const { data } = await fetchChampionMap(version);

  const entries = Object.values(data);
  if (entries.length === 0) {
    throw new Error("Champion data is empty — aborting to avoid wiping existing records");
  }

  let upserted = 0;
  const skipped: string[] = [];

  for (const champ of entries) {
    const numericId = parseInt(champ.key, 10);

    if (Number.isNaN(numericId)) {
      skipped.push(`${champ.id}(key=${champ.key})`);
      continue;
    }

    const imageUrl = `${DDRAGON}/cdn/${version}/img/champion/${champ.image.full}`;

    await prisma.champion.upsert({
      where: { id: numericId },
      create: {
        id: numericId,
        key: champ.id,
        name: champ.name,
        title: champ.title,
        roles: champ.tags,
        difficulty: champ.info.difficulty,
        imageUrl,
        patchVersion: version,
      },
      update: {
        key: champ.id,
        name: champ.name,
        title: champ.title,
        roles: champ.tags,
        difficulty: champ.info.difficulty,
        imageUrl,
        patchVersion: version,
      },
    });

    upserted++;
  }

  process.stdout.write(`  ✓ ${upserted} champions upserted (patch ${version})\n`);

  if (skipped.length > 0) {
    process.stdout.write(
      `  ⚠ ${skipped.length} champion(s) skipped (non-numeric key): ${skipped.join(", ")}\n`
    );
  }
}

// ── Standalone entry point ────────────────────────────────────────────────────
// Guard: only execute when run directly via `tsx scripts/syncChampions.ts`,
// not when imported by seed.ts or other modules.

const isEntryPoint = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/syncChampions.ts");

if (isEntryPoint) {
  loadEnvFiles([".env", ".env.local"]);
  const prisma = new PrismaClient();

  process.stdout.write("🏆 Syncing champions from Data Dragon...\n");

  syncChampions(prisma)
    .then(() => {
      process.stdout.write("✅ Champion sync complete.\n");
    })
    .catch((err: unknown) => {
      process.stderr.write(
        `❌ Champion sync failed: ${err instanceof Error ? err.message : String(err)}\n`
      );
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect().catch(() => {
        // Disconnect failure is non-fatal on exit
      });
    });
}
