import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { OPGG_BASE, USER_AGENT } from "../src/domains/meta/services/opggShared";
import type {
  BuildDataFile,
  ChampionBuildEntry,
  Position,
  QuizChampion,
} from "../src/domains/quiz/types/quiz.types";

// Builds src/domains/quiz/data/championBuilds.json, the prompt for the quiz's
// Build mode. Run it after a patch settles, review the diff, commit the JSON.
//
// Why a build step and not a runtime fetch: the quiz must not depend on a third
// party being up (ADR-024, LA-13). op.gg is an unofficial feed and the slowest
// of the three the app reads, so it is the last place a page render should go.
//
// The script owns its own view of the op.gg payload rather than borrowing the
// meta domain's schemas: this reads five fields out of a response that domain
// parses in full, and widening those schemas for a script is not this task.

const OUT = resolve(process.cwd(), "src/domains/quiz/data/championBuilds.json");
const ATTRIBUTES = resolve(process.cwd(), "src/domains/quiz/data/championAttributes.json");
const DDRAGON = "https://ddragon.leagueoflegends.com";
const FETCH_TIMEOUT_MS = 20_000;
const THROTTLE_MS = 250;

// The quiz's own position vocabulary → op.gg's path segment. The meta domain
// maps from Riot's (TOP/MIDDLE/BOTTOM/UTILITY); the quiz never speaks that one.
const POSITION_TO_OPGG: Record<Position, string> = {
  Top: "TOP",
  Jungle: "JUNGLE",
  Mid: "MID",
  Bot: "ADC",
  Support: "SUPPORT",
};

/** One "this group of ids is played this often" row. Every list op.gg returns
 *  for a build has this shape, sorted with the most played first. */
const groupSchema = z.object({ ids: z.array(z.union([z.number(), z.string()])), play: z.number() });

const detailSchema = z.object({
  data: z.object({
    core_items: z.array(groupSchema).default([]),
    boots: z.array(groupSchema).default([]),
    starter_items: z.array(groupSchema).default([]),
    summoner_spells: z.array(groupSchema).default([]),
    skill_masteries: z.array(groupSchema).default([]),
  }),
});

type Group = z.infer<typeof groupSchema>;

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** The most played group, or an empty list. op.gg sorts by pick rate, but a
 *  champion whose lists arrive unsorted would otherwise get a fringe build. */
function topGroup(groups: Group[]): Group | undefined {
  return groups.reduce<Group | undefined>(
    (best, g) => (!best || g.play > best.play ? g : best),
    undefined
  );
}

const numbers = (group: Group | undefined): number[] =>
  (group?.ids ?? []).map(Number).filter((n) => Number.isFinite(n));

const letters = (group: Group | undefined): string[] =>
  (group?.ids ?? []).map(String).filter((s) => /^[QWE]$/.test(s));

async function fetchBuild(champ: QuizChampion): Promise<ChampionBuildEntry | null> {
  const position = champ.positions[0];
  const payload = await fetchJson<unknown>(
    `${OPGG_BASE}/ranked/${champ.key}/${POSITION_TO_OPGG[position]}`,
    { "User-Agent": USER_AGENT, Accept: "application/json" }
  );
  if (!payload) return null;

  const parsed = detailSchema.safeParse(payload);
  if (!parsed.success) return null;
  const d = parsed.data.data;

  const core = numbers(topGroup(d.core_items));
  if (core.length < 2) return null; // an opening of one item is not a puzzle

  return {
    position,
    core,
    boots: numbers(topGroup(d.boots)),
    starter: numbers(topGroup(d.starter_items)),
    spells: numbers(topGroup(d.summoner_spells)),
    skillMax: letters(topGroup(d.skill_masteries)),
  };
}

/** Everything that identifies a build, so two champions who open, boot, start,
 *  summon and level identically can be told apart — or, failing that, dropped. */
function signature(entry: ChampionBuildEntry): string {
  return [entry.core, entry.boots, entry.starter, entry.spells, entry.skillMax]
    .map((part) => part.join("."))
    .join("|");
}

interface DdragonItem {
  name: string;
  gold?: { purchasable: boolean };
}

async function fetchNames(
  version: string,
  builds: Record<string, ChampionBuildEntry>
): Promise<Pick<BuildDataFile, "items" | "spells">> {
  const items = await fetchJson<{ data: Record<string, DdragonItem> }>(
    `${DDRAGON}/cdn/${version}/data/en_US/item.json`
  );
  const spells = await fetchJson<{
    data: Record<string, { key: string; name: string; image: { full: string } }>;
  }>(`${DDRAGON}/cdn/${version}/data/en_US/summoner.json`);
  if (!items || !spells) throw new Error("Data Dragon item.json or summoner.json unreachable");

  const referencedItems = new Set<number>();
  const referencedSpells = new Set<number>();
  for (const entry of Object.values(builds)) {
    for (const id of [...entry.core, ...entry.boots, ...entry.starter]) referencedItems.add(id);
    for (const id of entry.spells) referencedSpells.add(id);
  }

  const itemNames: BuildDataFile["items"] = {};
  for (const id of [...referencedItems].sort((a, b) => a - b)) {
    const name = items.data[String(id)]?.name;
    if (!name) throw new Error(`Item ${id} has no name in Data Dragon ${version}`);
    itemNames[String(id)] = { name };
  }

  const byKey = new Map(Object.values(spells.data).map((s) => [Number(s.key), s]));
  const spellNames: BuildDataFile["spells"] = {};
  for (const id of [...referencedSpells].sort((a, b) => a - b)) {
    const spell = byKey.get(id);
    if (!spell) throw new Error(`Summoner spell ${id} has no entry in Data Dragon ${version}`);
    spellNames[String(id)] = { name: spell.name, image: spell.image.full };
  }

  return { items: itemNames, spells: spellNames };
}

async function main(): Promise<void> {
  const attributes = JSON.parse(readFileSync(ATTRIBUTES, "utf-8")) as {
    version: string;
    champions: QuizChampion[];
  };
  const roster = attributes.champions
    .filter((c) => c.positions.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id));
  process.stdout.write(`  patch ${attributes.version}, ${roster.length} champions\n`);

  const entries: Record<string, ChampionBuildEntry> = {};
  const noBuild: string[] = [];

  // Sequential and throttled: op.gg is an unofficial endpoint and 170 parallel
  // requests is how a build script gets an IP blocked for everyone.
  for (const champ of roster) {
    const entry = await fetchBuild(champ);
    if (entry) entries[champ.id] = entry;
    else noBuild.push(champ.id);
    await new Promise((r) => setTimeout(r, THROTTLE_MS));
  }

  // A shared full signature means two champions are indistinguishable at every
  // rung of the clue ladder, so both leave. A shared *opening* is only a hard
  // puzzle — boots, starter, spells and skill order still separate them — so it
  // is logged and kept.
  const bySignature = new Map<string, string[]>();
  const byCore = new Map<string, string[]>();
  for (const [id, entry] of Object.entries(entries)) {
    bySignature.set(signature(entry), [...(bySignature.get(signature(entry)) ?? []), id]);
    const core = entry.core.join(".");
    byCore.set(core, [...(byCore.get(core) ?? []), id]);
  }

  const dropped: string[] = [];
  for (const ids of bySignature.values()) {
    if (ids.length < 2) continue;
    dropped.push(...ids);
    for (const id of ids) delete entries[id];
  }

  const builds = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
  const { items, spells } = await fetchNames(attributes.version, builds);

  const file: BuildDataFile & { _readme: string[] } = {
    version: attributes.version,
    _readme: [
      "Generated by scripts/syncQuizBuildData.ts (npm run sync:quiz-builds) from op.gg.",
      "Committed on purpose: the quiz never calls a third party at request time (ADR-024).",
      "Champions sharing an identical full build are dropped — the puzzle would have two answers.",
    ],
    items,
    spells,
    builds,
  };
  writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`, "utf-8");

  process.stdout.write(`  ✓ wrote ${Object.keys(builds).length} builds to championBuilds.json\n`);
  if (noBuild.length > 0) {
    process.stdout.write(`  ⚠ no usable build from op.gg: ${noBuild.join(", ")}\n`);
  }
  if (dropped.length > 0) {
    process.stdout.write(`  ⚠ dropped, identical full build: ${dropped.join(", ")}\n`);
  }
  for (const ids of byCore.values()) {
    if (ids.length > 1) process.stdout.write(`  · same opening, kept: ${ids.join(", ")}\n`);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`❌ ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
