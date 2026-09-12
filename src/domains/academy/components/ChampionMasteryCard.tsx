import Link from "next/link";
import { ArtBackdrop } from "@/domains/academy/components/ArtBackdrop";
import { ROLE_LABEL } from "@/domains/academy/roles";
import type { ChampionOption } from "@/domains/academy/services/championLessonService";
import type { LessonStatus } from "@/domains/academy/types";

interface ChampionMasteryCardProps {
  option: ChampionOption;
  status?: LessonStatus;
  index?: number;
}

const STATUS_LABEL: Partial<Record<LessonStatus, string>> = {
  in_progress: "In progress",
  completed: "Read",
  mastered: "Proved in ranked",
  review: "Numbers slipped — redo",
};

function winRateTone(winRate: number): string {
  if (winRate >= 60) return "text-accent";
  if (winRate < 45) return "text-danger";
  return "text-text";
}

function winRateBar(winRate: number): string {
  if (winRate >= 60) return "bg-accent";
  if (winRate < 45) return "bg-danger";
  return "bg-ink-400";
}

/**
 * One of the player's own champions, as a card fronted by that champion's splash.
 *
 * A champion lesson is about a specific champion more than about a concept, so the champion
 * is what the card leads with — the numbers under the name are the player's own, which is
 * what separates this from every static champion page on the internet.
 */
export function ChampionMasteryCard({
  option,
  status,
  index = 0,
}: ChampionMasteryCardProps): React.ReactElement {
  const label = status ? STATUS_LABEL[status] : undefined;

  return (
    <Link
      href={`/academy/champion/${option.slug}`}
      style={{ animationDelay: `${index * 55}ms` }}
      className={`notch group relative flex h-[216px] animate-hud-enter overflow-hidden bg-surface transition-colors hover:border-line-3 ${
        status === "mastered" ? "border border-acid-500/40" : "border border-border"
      }`}
    >
      <ArtBackdrop
        champion={option.champion}
        scrim="bottom"
        focus="54% 14%"
        opacity={0.4}
        sizes="(max-width: 820px) 100vw, (max-width: 1240px) 50vw, 400px"
        scanline={false}
      />

      <span className="relative flex w-full flex-col justify-between px-[18px] py-4">
        <span className="flex items-start justify-between gap-2.5">
          <span className="tag-cut border border-line-2 bg-surface-dark/60 px-[7px] py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-text-muted">
            {ROLE_LABEL[option.role]}
          </span>
          {label && (
            <span className="tag-cut border border-acid-500 bg-[var(--surface-accent)] px-[7px] py-[3px] text-right font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-accent">
              {label}
            </span>
          )}
        </span>

        <span>
          <span className="block font-display text-2xl font-black uppercase tracking-[0.03em] text-text transition-colors group-hover:text-accent">
            {option.champion}
          </span>
          <span className="mt-2 flex items-baseline gap-2.5">
            <span
              className={`font-mono text-[19px] font-bold tabular-nums ${winRateTone(option.winRate)}`}
            >
              {Math.round(option.winRate)}%
            </span>
            <span className="hud-label text-text-faint">{option.games} ranked games</span>
          </span>
          <span className="mt-3 block h-1 bg-fg-1/10">
            <span
              className={`block h-full animate-academy-bar ${winRateBar(option.winRate)}`}
              style={{
                width: `${Math.round(option.winRate)}%`,
                animationDelay: `${index * 50}ms`,
              }}
            />
          </span>
        </span>
      </span>
    </Link>
  );
}
