import Image from "next/image";
import Link from "next/link";
import { championLessonId } from "@/domains/academy/championLesson";
import { ROLE_LABEL } from "@/domains/academy/roles";
import { championIconUrl } from "@/lib/ddragon";
import type { ChampionOption } from "@/domains/academy/services/championLessonService";
import type { LessonStatus } from "@/domains/academy/types";

interface ChampionTeaserProps {
  champions: ChampionOption[];
  statuses: Map<string, LessonStatus>;
}

/** Win rate is the only number on the row, so it carries the verdict colour itself. */
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
 * The top four champions the player actually queues, beside the role path on the hub.
 *
 * Champion lessons are generated per player and never the same page twice, so this is the
 * only way a reader finds out they exist — a rail link to an empty-looking index would not
 * do it.
 */
export function ChampionTeaser({
  champions,
  statuses,
}: ChampionTeaserProps): React.ReactElement | null {
  if (champions.length === 0) return null;

  return (
    <div className="notch animate-hud-enter border border-border bg-surface [animation-delay:120ms]">
      <div className="flex items-center justify-between gap-3 border-b border-line-1 px-[18px] py-3.5">
        <span className="hud-label text-text-faint">{"// Your champions"}</span>
        <Link
          href="/academy/champion"
          className="hud-label text-accent transition-colors hover:text-acid-400"
        >
          All →
        </Link>
      </div>

      {champions.slice(0, 4).map((champion, i) => {
        const status = statuses.get(championLessonId(champion.champion, champion.role));
        const started = status === "in_progress";

        return (
          <Link
            key={champion.slug}
            href={`/academy/champion/${champion.slug}`}
            style={{ animationDelay: `${i * 40}ms` }}
            className="group grid animate-academy-row grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-line-1 px-[18px] py-3 transition-colors hover:bg-surface-2"
          >
            <Image
              src={championIconUrl(champion.champion)}
              alt=""
              width={36}
              height={36}
              className="tag-cut border border-line-2"
            />

            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.04em] text-text transition-colors group-hover:text-accent">
                  {champion.champion}
                </span>
                <span className="tag-cut border border-line-2 bg-surface-dark px-[7px] py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  {ROLE_LABEL[champion.role]}
                </span>
                {started && (
                  <span className="tag-cut border border-acid-500 bg-[var(--surface-accent)] px-[7px] py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-accent">
                    In progress
                  </span>
                )}
              </span>
              <span className="mt-1 block font-mono text-[10.5px] tracking-[0.1em] text-text-faint">
                {champion.games} ranked games
              </span>
            </span>

            <span className="flex items-center gap-2.5">
              <span className="block h-1 w-11 bg-surface-dark">
                <span
                  className={`block h-full animate-academy-bar ${winRateBar(champion.winRate)}`}
                  style={{
                    width: `${Math.round(champion.winRate)}%`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              </span>
              <span
                className={`w-9 text-right font-mono text-[12.5px] font-bold tabular-nums ${winRateTone(champion.winRate)}`}
              >
                {Math.round(champion.winRate)}%
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
