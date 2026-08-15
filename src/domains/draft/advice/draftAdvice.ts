import { POSITION_LABELS } from "@/domains/meta/positions";
import { DRAFT_SEQUENCE, stepAt, unavailableReason } from "@/domains/draft";
import type { DraftSeriesState, DraftSide } from "@/domains/draft";
import type { DraftCatalog, DraftChampion } from "@/domains/draft/draftCatalog.types";
import type { AdviceEntry, CounterTables, DraftAdvice, ScoreParts } from "./advice.types";
import {
  banTotal,
  compScore,
  counterScore,
  metaScore,
  pickTotal,
  priorityScore,
} from "./draftAdviceScoring";
import { buildTeamProfile } from "./teamProfile";

const SUGGESTIONS = 5;

/** Champions a side has locked as picks in this game. */
export function lockedPicks(
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

function reasonsFor(
  champion: DraftChampion,
  parts: ScoreParts,
  kind: "PICK" | "BAN",
  lanes: string
): string[] {
  const reasons: string[] = [];
  if (champion.winRate) reasons.push(`${champion.winRate.toFixed(1)}% ${lanes}`);
  if (kind === "PICK") {
    if (parts.counter >= 0.5) reasons.push(`+${parts.counter} into their picks`);
    else if (parts.counter <= -0.5) reasons.push(`${parts.counter} into their picks`);
    if (parts.comp > 0) reasons.push(compReason(champion, parts));
  } else {
    if (parts.counter >= 0.5) reasons.push(`+${parts.counter} into your picks`);
    if (champion.banRate >= 10) reasons.push(`banned in ${champion.banRate.toFixed(0)}% of games`);
  }
  return reasons.filter(Boolean);
}

function compReason(champion: DraftChampion, parts: ScoreParts): string {
  if (champion.tags.includes("Tank") || champion.tags.includes("Fighter")) {
    return parts.comp >= 1.5 ? "adds the frontline you are missing" : "adds some frontline";
  }
  return champion.magic > champion.attack ? "breaks up your AD skew" : "breaks up your AP skew";
}

/**
 * What to do on the turn in front of you, from this patch's own numbers.
 *
 * Everything here runs on the client from the catalogue fetched when the room
 * opened plus the counter tables for the ten champions on the board — so it
 * costs nothing per turn, and it is arithmetic rather than an opinion. Each
 * suggestion carries its reasons; a ranked list with no "why" is a horoscope.
 */
export function buildDraftAdvice(
  state: DraftSeriesState,
  gameNumber: number,
  side: DraftSide,
  catalog: DraftCatalog,
  tables: CounterTables
): DraftAdvice | null {
  const game = state.games.find((g) => g.gameNumber === gameNumber);
  const step = game ? stepAt(game.step) : null;
  if (!game || !step || game.phase !== "IN_PROGRESS") return null;

  const enemy: DraftSide = side === "BLUE" ? "RED" : "BLUE";
  const allyPicks = lockedPicks(state, gameNumber, side, catalog);
  const enemyPicks = lockedPicks(state, gameNumber, enemy, catalog);
  const ally = buildTeamProfile(allyPicks);
  const enemyProfile = buildTeamProfile(enemyPicks);

  const kind = step.kind;
  // For a pick we score against the enemy's board; for a ban, against our own —
  // the question is not "is it good" but "does it beat what we have committed".
  const against = (kind === "PICK" ? enemyPicks : allyPicks).map((c) => c.key);
  const needed = kind === "PICK" ? ally.missingLanes : enemyProfile.missingLanes;

  const entries: AdviceEntry[] = catalog.champions
    .filter((champion) => !unavailableReason(state, gameNumber, side, champion.key))
    .filter(
      (champion) =>
        needed.length === 0 ||
        champion.lanes.length === 0 ||
        champion.lanes.some((lane) => needed.includes(lane))
    )
    .map((champion) => {
      const parts: ScoreParts = {
        meta: metaScore(champion),
        counter: counterScore(champion, against, tables),
        comp: kind === "PICK" ? compScore(champion, ally) : 0,
        priority: priorityScore(champion),
      };
      const lanes = champion.lanes.map((l) => POSITION_LABELS[l]).join("/") || "overall";
      return {
        champion,
        parts,
        total: kind === "PICK" ? pickTotal(parts) : banTotal(parts),
        reasons: reasonsFor(champion, parts, kind, lanes),
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, SUGGESTIONS);

  return { kind, entries, ally, enemy: enemyProfile };
}

/** The steps at which a side is on the clock, for the panel's heading. */
export const TURNS_PER_SIDE = DRAFT_SEQUENCE.length / 2;
