"use client";

import { DRAFT_SEQUENCE, SLOTS_PER_SIDE, stepAt } from "@/domains/draft";
import type { DraftGameState, DraftSide } from "@/domains/draft";
import { ChampionIcon } from "@/components/ui/ChampionIcon";

interface BanRailProps {
  game: DraftGameState;
}

interface BanSlot {
  step: number;
  championKey: string | null;
  filled: boolean;
  pending: boolean;
}

function bansFor(game: DraftGameState, side: DraftSide): BanSlot[] {
  return Array.from({ length: SLOTS_PER_SIDE }, (_, slot) => {
    const step = DRAFT_SEQUENCE.find((s) => s.side === side && s.kind === "BAN" && s.slot === slot);
    const action = step ? game.actions.find((a) => a.step === step.index) : undefined;
    return {
      step: step?.index ?? -1,
      championKey: action?.championKey ?? null,
      filled: Boolean(action),
      pending: game.phase === "IN_PROGRESS" && game.step === step?.index,
    };
  });
}

function phaseLabel(game: DraftGameState): string {
  if (game.phase === "COMPLETE") return "Draft complete";
  if (game.phase === "LOBBY") return "Ready check";
  const step = stepAt(game.step);
  if (!step) return "";
  if (game.step < 6) return "Ban phase 1";
  if (game.step < 12) return "Pick phase 1";
  if (game.step < 16) return "Ban phase 2";
  return "Pick phase 2";
}

function BanTile({ slot, side }: { slot: BanSlot; side: DraftSide }): React.JSX.Element {
  const accent = side === "BLUE" ? "border-accent-blue" : "border-danger";
  return (
    <span
      className={`tag-cut relative flex h-[34px] w-[34px] shrink-0 items-center justify-center border bg-surface-dark ${
        slot.pending ? `${accent} animate-glow-pulse` : slot.championKey ? accent : "border-line-1"
      }`}
      title={
        slot.championKey ? `${slot.championKey} banned` : slot.filled ? "Ban passed" : "Ban slot"
      }
    >
      {slot.championKey ? (
        <ChampionIcon name={slot.championKey} size={32} className="brightness-75 grayscale" />
      ) : (
        // A filled slot with no champion is a passed or lapsed ban — it has to
        // read differently from a slot the draft has not reached yet.
        <span className="text-[10px] text-text-faint">{slot.filled ? "—" : ""}</span>
      )}
    </span>
  );
}

/**
 * Both sides' bans on one rail under the board.
 *
 * Bans used to sit under each team's picks, which put ten small tiles in two
 * places and made "what is gone" a question you answered by looking twice.
 * On one line they read as what they are: the shared shape of the game.
 */
export function BanRail({ game }: BanRailProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 border-t border-line-1 bg-surface-dark px-4 py-2.5 md:px-6">
      <div className="flex items-center gap-1.5">
        <span className="mr-1 hidden font-mono text-[9px] uppercase tracking-micro text-text-muted sm:inline">
          Bans
        </span>
        {bansFor(game, "BLUE").map((slot) => (
          <BanTile key={slot.step} slot={slot} side="BLUE" />
        ))}
      </div>

      <span className="text-center font-mono text-[9.5px] uppercase tracking-label text-fg-4">
        {phaseLabel(game)}
      </span>

      <div className="flex items-center justify-end gap-1.5">
        {bansFor(game, "RED").map((slot) => (
          <BanTile key={slot.step} slot={slot} side="RED" />
        ))}
        <span className="ml-1 hidden font-mono text-[9px] uppercase tracking-micro text-text-muted sm:inline">
          Bans
        </span>
      </div>
    </div>
  );
}
