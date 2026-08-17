"use client";

import { useMemo, useRef, useState } from "react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";

interface ChampionGuessInputProps {
  champions: { id: string; name: string }[];
  alreadyGuessed: string[];
  disabled: boolean;
  onGuess: (name: string) => void;
}

const MAX_SUGGESTIONS = 8;

function fold(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function ChampionGuessInput({
  champions,
  alreadyGuessed,
  disabled,
  onGuess,
}: ChampionGuessInputProps): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const guessed = useMemo(() => new Set(alreadyGuessed), [alreadyGuessed]);

  const suggestions = useMemo(() => {
    const needle = fold(query);
    if (!needle) return [];
    // Prefix matches first: typing "ka" should offer Kalista before Rek'Sai.
    const prefix: typeof champions = [];
    const contains: typeof champions = [];
    for (const champ of champions) {
      if (guessed.has(champ.id)) continue;
      const folded = fold(champ.name);
      if (folded.startsWith(needle)) prefix.push(champ);
      else if (folded.includes(needle)) contains.push(champ);
    }
    return [...prefix, ...contains].slice(0, MAX_SUGGESTIONS);
  }, [champions, guessed, query]);

  function commit(name: string): void {
    onGuess(name);
    setQuery("");
    setHighlight(0);
    inputRef.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      // Enter on a typed-out name works even with no suggestion highlighted, so
      // a fast typist never has to look at the dropdown.
      const choice = suggestions[highlight]?.name ?? query.trim();
      if (choice) commit(choice);
    } else if (event.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
        }}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={disabled ? "Solved — come back tomorrow" : "Type a champion…"}
        aria-label="Guess a champion"
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        className="notch-sm w-full border border-line-2 bg-surface-dark px-3.5 py-2.5 font-sans text-sm text-fg-1 placeholder:text-fg-4 focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />

      {suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden border border-line-2 bg-surface shadow-lg"
        >
          {suggestions.map((champ, index) => (
            <li key={champ.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => commit(champ.name)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                  index === highlight ? "bg-surface-2 text-fg-1" : "text-fg-2"
                }`}
              >
                <ChampionIcon name={champ.name} size={24} />
                {champ.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
