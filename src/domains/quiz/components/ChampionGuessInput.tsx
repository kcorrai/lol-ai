"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
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

  function submit(): void {
    const choice = suggestions[highlight]?.name ?? query.trim();
    if (choice) commit(choice);
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
      submit();
    } else if (event.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <div className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-4"
        />
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
          className="tag-cut h-11 w-full border border-line-2 bg-surface-dark pl-10 pr-3.5 font-sans text-sm text-fg-1 placeholder:text-fg-4 focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="tag-cut btn-glow flex h-11 items-center gap-2 border border-accent bg-accent px-5 font-mono text-[12px] font-bold uppercase tracking-label text-ink-1000 transition-colors hover:bg-acid-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Guess
        <ArrowRight aria-hidden className="h-3.5 w-3.5" />
      </button>

      {suggestions.length > 0 && (
        // Opens upward: the guess bar sits on the bottom edge of the stage panel,
        // and a downward list would be clipped by the panel's own chamfer.
        <ul
          role="listbox"
          className="absolute bottom-full left-0 right-0 z-30 mb-1.5 max-h-[222px] overflow-y-auto border border-line-2 bg-surface-2 shadow-[var(--shadow-2)]"
        >
          {suggestions.map((champ, index) => (
            <li key={champ.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => commit(champ.name)}
                className={`flex w-full items-center gap-2.5 border-b border-line-1 px-3 py-2 text-left text-[13.5px] last:border-b-0 ${
                  index === highlight ? "bg-ink-600 text-fg-1" : "text-fg-2"
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
