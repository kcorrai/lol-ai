import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChampionGuessInput } from "./ChampionGuessInput";

vi.mock("@/components/ui/ChampionIcon", () => ({ ChampionIcon: () => null }));

const CHAMPIONS = [
  { id: "Sett", name: "Sett" },
  { id: "Ahri", name: "Ahri" },
];

function renderInput(disabled: boolean, onGuess = vi.fn()) {
  const view = render(
    <ChampionGuessInput
      champions={CHAMPIONS}
      alreadyGuessed={[]}
      disabled={disabled}
      onGuess={onGuess}
    />
  );
  return { ...view, onGuess, input: screen.getByLabelText("Guess a champion") };
}

describe("ChampionGuessInput", () => {
  it("keeps focus on the field through a guess being checked", () => {
    const { input, rerender, onGuess } = renderInput(false);
    input.focus();
    fireEvent.change(input, { target: { value: "sett" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onGuess).toHaveBeenCalledWith("Sett");

    // The board flips `disabled` on while the guess is in flight. A browser
    // blurs a disabled input (jsdom does not), so the field must never be one.
    rerender(
      <ChampionGuessInput
        champions={CHAMPIONS}
        alreadyGuessed={["Sett"]}
        disabled
        onGuess={onGuess}
      />
    );
    expect(input).not.toBeDisabled();
    expect(document.activeElement).toBe(input);
    rerender(
      <ChampionGuessInput
        champions={CHAMPIONS}
        alreadyGuessed={["Sett"]}
        disabled={false}
        onGuess={onGuess}
      />
    );
    expect(document.activeElement).toBe(input);
  });

  it("holds a typed-ahead guess while the previous one is being checked", () => {
    const { input, onGuess } = renderInput(true);
    fireEvent.change(input, { target: { value: "ahri" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onGuess).not.toHaveBeenCalled();
    expect(input).toHaveValue("ahri");
  });
});
