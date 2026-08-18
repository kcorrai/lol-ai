"use client";

import { championSplashUrl } from "@/lib/ddragon";

interface ImpostorGridProps {
  candidates: { id: string; name: string }[];
  /** Champion ids already picked — struck through rather than removed, so the
   *  board a player is reasoning about does not move under them. */
  alreadyGuessed: string[];
  disabled: boolean;
  onGuess: (name: string) => void;
}

/**
 * The eight portraits. Every tile is drawn identically and the order comes from
 * a shuffle the server seeds on the day rather than on the answer, so nothing
 * here — position, markup or asset — can be read as a tell.
 */
export function ImpostorGrid({
  candidates,
  alreadyGuessed,
  disabled,
  onGuess,
}: ImpostorGridProps): React.JSX.Element {
  const guessed = new Set(alreadyGuessed);

  return (
    <div className="grid grid-cols-4 gap-2.5 max-[520px]:grid-cols-2">
      {candidates.map((champion) => {
        const spent = guessed.has(champion.id);
        return (
          <button
            key={champion.id}
            type="button"
            disabled={disabled || spent}
            onClick={() => onGuess(champion.name)}
            className={`notch relative h-[104px] overflow-hidden border p-0 text-left transition-transform duration-150 ease-out enabled:hover:-translate-y-0.5 ${
              spent ? "border-line-2 opacity-40" : "border-line-1 hover:border-accent"
            }`}
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-cover"
              style={{
                backgroundImage: `url('${championSplashUrl(champion.name)}')`,
                backgroundPosition: "52% 16%",
              }}
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink-1000 via-ink-1000/55 to-transparent"
            />
            <span
              className={`absolute inset-x-0 bottom-0 block px-2 py-1.5 font-display text-[12px] font-bold uppercase leading-tight tracking-wide ${
                spent ? "text-fg-4 line-through" : "text-fg-1"
              }`}
            >
              {champion.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
