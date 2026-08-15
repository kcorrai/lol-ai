import { evaluateDraft } from "@/domains/meta";
import type { DraftEvaluation, DraftTeam } from "@/domains/meta";
import type { DraftSeriesState, DraftSide } from "@/domains/draft/engine/draft.types";
import type { DraftCatalog, DraftChampion } from "@/domains/draft/draftCatalog.types";
import { assignLanes } from "@/domains/draft/advice/teamProfile";
import { getDraftCatalog } from "./draftCatalogService";
import { getSeriesForGame } from "./draftSeriesService";

export interface DraftSummary {
  blue: DraftTeam;
  red: DraftTeam;
  evaluation: DraftEvaluation | null;
}

function picksFor(
  state: DraftSeriesState,
  gameNumber: number,
  side: DraftSide,
  catalog: DraftCatalog
): DraftChampion[] {
  const game = state.games.find((g) => g.gameNumber === gameNumber);
  if (!game) return [];
  const byKey = new Map(catalog.champions.map((c) => [c.key.toLowerCase(), c]));
  return game.actions
    .filter((a) => a.kind === "PICK" && a.side === side && a.championKey)
    .map((a) => byKey.get(a.championKey!.toLowerCase()))
    .filter((c): c is DraftChampion => Boolean(c));
}

/** Lane-keyed comp, which is the shape `evaluateDraft` already speaks. */
function toDraftTeam(champions: DraftChampion[]): DraftTeam {
  const team: DraftTeam = {};
  for (const [key, lane] of assignLanes(champions)) {
    const champion = champions.find((c) => c.key.toLowerCase() === key);
    if (champion) team[lane] = champion.key;
  }
  return team;
}

/**
 * The verdict for a finished game.
 *
 * Deliberately no new analysis: the room hands its final comps to the same
 * `evaluateDraft` the standalone analyser uses, so a draft run here and a draft
 * pasted there cannot come back with different answers. Lanes are inferred —
 * a draft never states them — which is the one thing this adds.
 */
export async function getDraftSummary(
  code: string,
  gameNumber: number
): Promise<DraftSummary | null> {
  const [result, catalog] = await Promise.all([
    getSeriesForGame(code, gameNumber, null),
    getDraftCatalog(),
  ]);
  if (!result.ok) return null;

  const game = result.state.games.find((g) => g.gameNumber === gameNumber);
  if (!game || game.phase !== "COMPLETE") return null;

  const blue = toDraftTeam(picksFor(result.state, gameNumber, "BLUE", catalog));
  const red = toDraftTeam(picksFor(result.state, gameNumber, "RED", catalog));

  return { blue, red, evaluation: await evaluateDraft(blue, red).catch(() => null) };
}
