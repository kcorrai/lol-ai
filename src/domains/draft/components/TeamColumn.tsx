"use client";

import { DRAFT_SEQUENCE, SLOTS_PER_SIDE } from "@/domains/draft";
import type { DraftActionKind, DraftGameState, DraftSide } from "@/domains/draft";
import { DraftSlot } from "./DraftSlot";

interface Props {
  game: DraftGameState;
  side: DraftSide;
  teamName: string;
  ready: boolean;
}

interface Slot {
  step: number;
  championKey: string | null;
  filled: boolean;
  pending: boolean;
  timedOut: boolean;
}

function slotsFor(game: DraftGameState, side: DraftSide, kind: DraftActionKind): Slot[] {
  return Array.from({ length: SLOTS_PER_SIDE }, (_, slot) => {
    const step = DRAFT_SEQUENCE.find((s) => s.side === side && s.kind === kind && s.slot === slot);
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

export function TeamColumn({ game, side, teamName, ready }: Props): React.ReactElement {
  const accent = side === "BLUE" ? "text-accent-blue" : "text-danger";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={`truncate font-display text-[15px] font-bold ${accent}`}>{teamName}</h2>
        {game.phase === "LOBBY" && (
          <span className={`text-[11px] ${ready ? "text-accent" : "text-text-faint"}`}>
            {ready ? "Ready" : "Not ready"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {slotsFor(game, side, "PICK").map((slot) => (
          <DraftSlot key={slot.step} kind="PICK" side={side} {...slot} />
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {slotsFor(game, side, "BAN").map((slot) => (
          <DraftSlot key={slot.step} kind="BAN" side={side} {...slot} />
        ))}
      </div>
    </div>
  );
}
