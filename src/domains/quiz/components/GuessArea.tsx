"use client";

import type { DailyPuzzle } from "@/domains/quiz";
import { ChampionGuessInput } from "./ChampionGuessInput";
import { ImpostorGrid } from "./ImpostorGrid";

interface GuessAreaProps {
  puzzle: DailyPuzzle;
  /** Every champion, for the typed modes. Impostor names its own eight. */
  champions: { id: string; name: string }[];
  alreadyGuessed: string[];
  disabled: boolean;
  onGuess: (name: string) => void;
}

/**
 * How a guess is made. Impostor is picked off a board of eight, every other mode
 * is typed — both hand the same champion name to the same submit, so the game
 * itself does not care which one the player used.
 */
export function GuessArea({
  puzzle,
  champions,
  alreadyGuessed,
  disabled,
  onGuess,
}: GuessAreaProps): React.JSX.Element {
  if (puzzle.prompt.kind === "impostor") {
    return (
      <ImpostorGrid
        candidates={puzzle.prompt.candidates}
        alreadyGuessed={alreadyGuessed}
        disabled={disabled}
        onGuess={onGuess}
      />
    );
  }

  return (
    <ChampionGuessInput
      champions={champions}
      alreadyGuessed={alreadyGuessed}
      disabled={disabled}
      onGuess={onGuess}
    />
  );
}
