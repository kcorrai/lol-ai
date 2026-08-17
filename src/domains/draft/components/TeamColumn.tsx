"use client";

import { DRAFT_SEQUENCE, SLOTS_PER_SIDE } from "@/domains/draft";
import type { DraftGameState, DraftSide } from "@/domains/draft";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";
import { PickRow } from "./PickRow";

interface Props {
  game: DraftGameState;
  side: DraftSide;
  teamName: string;
  ready: boolean;
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
 * One side's five picks. Bans moved to the rail under the board (BanRail), so
 * this column is the comp and nothing else.
 */
export function TeamColumn({
  game,
  side,
  teamName,
  ready,
  championsByKey,
}: Props): React.ReactElement {
  const blue = side === "BLUE";

  return (
    <div className="flex min-h-0 flex-col gap-2">
      {/* The turn bar already names both sides; repeating it here put the same
          two words on screen twice. Only the lobby's ready state is kept, and
          the name goes with it so the pill is still attributable. */}
      {game.phase === "LOBBY" && (
        <div className={`flex items-baseline gap-2 ${blue ? "" : "flex-row-reverse"}`}>
          <span
            className={`tag-cut shrink-0 border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-label ${
              ready ? "border-acid-500 bg-acid-500/10 text-acid-500" : "border-line-2 text-fg-3"
            }`}
          >
            {ready ? "Ready" : "Not ready"}
          </span>
          <span className="min-w-0 truncate font-mono text-[9.5px] uppercase tracking-wide text-fg-4">
            {teamName}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
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
