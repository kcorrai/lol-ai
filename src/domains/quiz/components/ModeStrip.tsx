"use client";

import {
  AudioLines,
  Ghost,
  Grid3x3,
  ImageIcon,
  ScrollText,
  Smile,
  Sparkles,
  Swords,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { championSplashUrl } from "@/lib/ddragon";
import { QUIZ_MODES, type ModeResult, type QuizMode } from "@/domains/quiz";

/** Two tabs are not QuizModes: the personal quiz has no daily answer to guess,
 *  and the leaderboard is not a puzzle at all. */
export type QuizTab = QuizMode | "personal" | "board";

export const MODE_LABELS: Record<QuizMode, string> = {
  classic: "Classic",
  ability: "Ability",
  splash: "Splash",
  lore: "Lore",
  quote: "Quote",
  emoji: "Emoji",
  build: "Build",
  impostor: "Impostor",
};

interface Tile {
  key: QuizTab;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Decorative only, and the same champion every day — it cannot leak an answer. */
  art: string;
}

export const QUIZ_TILES: readonly Tile[] = [
  { key: "classic", label: "Classic", hint: "Column by column", icon: Grid3x3, art: "Jarvan IV" },
  { key: "ability", label: "Ability", hint: "One icon", icon: Sparkles, art: "Nautilus" },
  { key: "splash", label: "Splash", hint: "Camera pulls back", icon: ImageIcon, art: "Ashe" },
  { key: "lore", label: "Lore", hint: "Names redacted", icon: ScrollText, art: "Swain" },
  { key: "quote", label: "Quote", hint: "One voice line", icon: AudioLines, art: "Karthus" },
  { key: "emoji", label: "Emoji", hint: "Clues drip in", icon: Smile, art: "Kennen" },
  { key: "build", label: "Build", hint: "Read the items", icon: Swords, art: "Jax" },
  { key: "impostor", label: "Impostor", hint: "Odd one out", icon: Ghost, art: "Neeko" },
  { key: "personal", label: "Yours", hint: "Your own games", icon: UserRound, art: "Ahri" },
  { key: "board", label: "Board", hint: "Today's ranking", icon: Trophy, art: "Thresh" },
] as const;

export const MODE_ICONS: Record<QuizTab, LucideIcon> = Object.fromEntries(
  QUIZ_TILES.map((tile) => [tile.key, tile.icon])
) as Record<QuizTab, LucideIcon>;

interface ModeStripProps {
  active: QuizTab;
  /** Today's finished modes, so the strip doubles as the day's scorecard. */
  results: ModeResult[];
  onSelect: (tab: QuizTab) => void;
}

function status(tab: QuizTab, results: ModeResult[]): { text: string; done: boolean } {
  if (tab === "board") return { text: "Live", done: false };
  if (tab === "personal") return { text: "Open", done: false };
  const result = results.find((r) => r.mode === tab);
  if (!result) return { text: "Open", done: false };
  if (!result.solved) return { text: "Revealed", done: false };
  return {
    text: `${result.guessCount} ${result.guessCount === 1 ? "guess" : "guesses"}`,
    done: true,
  };
}

export function ModeStrip({ active, results, onSelect }: ModeStripProps): React.JSX.Element {
  return (
    <div
      role="tablist"
      aria-label="Quiz modes"
      className="grid auto-cols-[minmax(132px,1fr)] grid-flow-col gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]"
    >
      {QUIZ_TILES.map((tile) => {
        const on = tile.key === active;
        const state = status(tile.key, results);
        const Icon = tile.icon;
        return (
          <button
            key={tile.key}
            type="button"
            role="tab"
            aria-label={tile.label}
            aria-selected={on}
            onClick={() => onSelect(tile.key)}
            className={`notch relative h-[116px] min-w-[132px] overflow-hidden border p-0 text-left transition-transform duration-150 ease-out hover:-translate-y-0.5 ${
              on ? "glow-accent-soft border-accent" : "border-line-1"
            }`}
          >
            <span
              aria-hidden
              className={`absolute inset-0 bg-cover transition-opacity ${
                on ? "opacity-50" : "opacity-25 grayscale-[.5]"
              }`}
              style={{
                backgroundImage: `url('${championSplashUrl(tile.art)}')`,
                backgroundPosition: "52% 14%",
              }}
            />
            {on && (
              <span
                aria-hidden
                className="absolute inset-x-0 h-[34%] animate-quiz-scan bg-gradient-to-b from-transparent via-accent/15 to-transparent"
              />
            )}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink-1000 via-ink-1000/70 to-ink-1000/25"
            />

            <span className="relative flex h-full flex-col justify-between gap-4 p-3">
              <span className="flex items-start justify-between gap-2">
                <Icon
                  className={`h-[15px] w-[15px] shrink-0 ${on ? "text-accent" : "text-fg-2"}`}
                />
                <span
                  className={`tag-cut border px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-label ${
                    state.done
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line-2 bg-ink-1000/60 text-fg-4"
                  }`}
                >
                  {state.text}
                </span>
              </span>
              <span>
                <span
                  className={`block font-display text-[13.5px] font-extrabold uppercase tracking-wide ${
                    on ? "text-accent" : "text-fg-1"
                  }`}
                >
                  {tile.label}
                </span>
                <span className="mt-1 block font-mono text-[9px] uppercase tracking-label text-fg-4">
                  {tile.hint}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Order the "Next mode" button walks, kept next to the strip it mirrors. */
export const TAB_ORDER: readonly QuizTab[] = [...QUIZ_MODES, "personal", "board"] as const;
