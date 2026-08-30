import { ChampionSplash } from "@/components/hud/Splash";
import { formatCount } from "@/lib/uiLocale";

export interface Suggestion {
  championKey: string;
  name: string;
  winRate: number;
  games: number;
}

/**
 * The lane's strongest three, as a way into the pane rather than an instruction.
 *
 * The empty right-hand pane used to say "pick a champion" and stop, which is a screen
 * telling the player to go and do something they were already going to do. Three cards they
 * can press is the same sentence with a way to answer it — and on a screen this window is
 * most often opened at between games, it is the difference between a prompt and a start.
 *
 * Three, and always the top three of whatever is on the left: this is the same ranking, not
 * a second opinion about it.
 */
export function ChampionSuggestions({
  suggestions,
  onSelect,
}: {
  suggestions: readonly Suggestion[];
  onSelect: (key: string) => void;
}): React.ReactElement | null {
  if (suggestions.length === 0) return null;

  return (
    <div className="w-full max-w-[560px]">
      <p className="hud-label mb-3 text-[9.5px] tracking-[0.18em]">Strongest in this lane</p>
      <ul className="grid grid-cols-3 gap-2.5">
        {suggestions.map((suggestion, index) => (
          <li key={suggestion.championKey}>
            <button
              type="button"
              onClick={() => onSelect(suggestion.championKey)}
              style={{ animationDelay: `${index * 60}ms` }}
              className="hud-tile-in notch relative h-32 w-full cursor-pointer overflow-hidden border border-border bg-surface-dark text-left transition-colors duration-150 hover:border-accent"
            >
              <ChampionSplash
                champion={suggestion.championKey}
                opacity={1}
                position="54% 14%"
                className="brightness-[.74]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink-1000 via-ink-1000/40 to-transparent" />
              <span className="relative flex h-full flex-col justify-end p-3">
                <span className="font-display text-sm font-bold uppercase tracking-[0.04em] text-text">
                  {suggestion.name}
                </span>
                <span className="mt-1.5 flex items-baseline gap-2">
                  <span className="font-mono text-[13px] font-bold text-accent">
                    {suggestion.winRate.toFixed(1)}%
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-text-faint">
                    {formatCount(suggestion.games)}
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
