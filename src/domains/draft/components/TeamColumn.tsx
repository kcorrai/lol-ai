"use client";

import { DRAFT_SEQUENCE, SLOTS_PER_SIDE } from "@/domains/draft";
import type { DraftGameState, DraftSide } from "@/domains/draft";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";
import { PickRow } from "./PickRow";

interface Props {
  game: DraftGameState;
  side: DraftSide;
  /** Catalog lookup, so a filled row can show the champion's patch win rate. */
  championsByKey: Map<string, DraftChampion>;
}

interface Slot {
  step: number;
  championKey: string | null;
  filled: boolean;
  pending: boolean;
  timedOut: boolean;
}

function picksFor(game: DraftGameState, side: DraftSide): Slot[] {
  return Array.from({ length: SLOTS_PER_SIDE }, (_, slot) => {
    const step = DRAFT_SEQUENCE.find((s) => s.side === side && s.kind === "PICK" && s.slot === slot);
    const action = step ? game.actions.find((a) => a.step === step.index) : undefined;
    return {
      step: step?.index ?? -1,
      championKey: action?.championKey ?? null,
      filled: Boolean(action),
      pending: game.phase === "IN_PROGRESS" && game.step === step?.index,
      timedOut: action?.timedOut ?? false,
    };
  });
}

/**
 * One side's five picks, filling the column.
 *
 * Bans moved to the rail under the board and the team name to the turn bar, so
 * this column is the comp and nothing else — five rows sharing the height the
 * board gives them.
 */
export function TeamColumn({ game, side, championsByKey }: Props): React.ReactElement {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {picksFor(game, side).map((slot, index) => (
          <PickRow
            key={slot.step}
            side={side}
            index={index}
            champion={slot.championKey ? (championsByKey.get(slot.championKey) ?? null) : null}
            pending={slot.pending}
            filled={slot.filled}
            timedOut={slot.timedOut}
          />
        ))}
      </div>
    </div>
  );
}
