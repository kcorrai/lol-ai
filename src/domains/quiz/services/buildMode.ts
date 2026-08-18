import builds from "@/domains/quiz/data/championBuilds.json";
import { allChampions } from "@/domains/quiz/services/championPool";
import type {
  BuildDataFile,
  BuildItem,
  BuildSpell,
  ChampionBuildEntry,
  QuizChampion,
  QuizPrompt,
} from "@/domains/quiz/types/quiz.types";

// Build: a champion's signature item path is the prompt, the champion is the
// answer. The data is compiled into the repo by scripts/syncQuizBuildData.ts —
// see that file for why it is not fetched (ADR-024, LA-13).
//
// The `_readme` key in the JSON is why this goes through `unknown`; no champion
// is called "_readme", so the lookups below can never reach it.
const FILE = builds as unknown as BuildDataFile;

/** Patch the build data was compiled from. Shown next to the prompt, because a
 *  build that was signature two patches ago is a lie the player cannot see. */
export const BUILD_DATASET_VERSION: string = FILE.version;

export function buildFor(championId: string): ChampionBuildEntry | undefined {
  return FILE.builds[championId];
}

/** Champions with a compiled build. The rest are simply never dealt — a champion
 *  whose build collided with another's was dropped at compile time. */
export function buildPool(): readonly QuizChampion[] {
  return allChampions().filter((c) => Boolean(FILE.builds[c.id]));
}

function items(ids: readonly number[]): BuildItem[] {
  return ids.map((id) => ({ id, name: FILE.items[String(id)]?.name ?? `Item ${id}` }));
}

function spells(ids: readonly number[]): BuildSpell[] {
  return ids.map((id) => {
    const spell = FILE.spells[String(id)];
    return { id, name: spell?.name ?? `Spell ${id}`, image: spell?.image ?? "" };
  });
}

/**
 * What the board is allowed to show after `misses` wrong guesses.
 *
 * One rung per miss, withheld on the server exactly like the emoji string: a
 * player who opens devtools sees the same three items everyone else does.
 *
 * | misses | revealed          |
 * |--------|-------------------|
 * | 0      | the core items    |
 * | 1      | + boots           |
 * | 2      | + starter items   |
 * | 3      | + summoner spells |
 * | 4      | + skill max order |
 *
 * The fifth miss adds the champion's position, which every mode hands out
 * through `hintFor` rather than through the prompt.
 */
export function visibleBuild(champion: QuizChampion, misses: number): QuizPrompt {
  const entry = buildFor(champion.id);
  if (!entry) return { kind: "build", core: [] };

  return {
    kind: "build",
    core: items(entry.core),
    ...(misses >= 1 ? { boots: items(entry.boots) } : {}),
    ...(misses >= 2 ? { starter: items(entry.starter) } : {}),
    ...(misses >= 3 ? { spells: spells(entry.spells) } : {}),
    ...(misses >= 4 ? { skillMax: entry.skillMax } : {}),
  };
}
