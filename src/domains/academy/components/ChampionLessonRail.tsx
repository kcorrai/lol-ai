import Image from "next/image";
import { formatMetric } from "@/domains/academy/assignments";
import { ROLE_LABEL } from "@/domains/academy/roles";
import { championIconUrl } from "@/lib/ddragon";
import type { AssignmentTarget } from "@/domains/academy/assignments";
import type { RoleId } from "@/domains/academy/types";

interface ChampionLessonRailProps {
  champion: string;
  role: RoleId;
  games: number;
  winRate: number;
  /** The number this lesson is asking the player to move, when we can measure it. */
  target: AssignmentTarget | null;
}

/**
 * The column beside a champion lesson: whose champion this is, and the number the lesson
 * is about.
 *
 * A champion lesson has no track to sit in, so where a curriculum lesson shows its place in
 * the order this shows the record the lesson was generated from — which is the equivalent
 * answer to "why am I reading this?".
 */
export function ChampionLessonRail({
  champion,
  role,
  games,
  winRate,
  target,
}: ChampionLessonRailProps): React.ReactElement {
  const tone = winRate >= 60 ? "text-accent" : winRate < 45 ? "text-danger" : "text-text";

  return (
    <div className="grid gap-3.5 lg:sticky lg:top-4">
      <div className="notch animate-hud-enter border border-border bg-surface px-[18px] py-4 [animation-delay:90ms]">
        <p className="hud-label text-text-faint">{"// Built from your games"}</p>
        <div className="mt-3 flex items-center gap-3">
          <Image
            src={championIconUrl(champion)}
            alt=""
            width={42}
            height={42}
            className="tag-cut border border-line-2"
          />
          <div className="min-w-0">
            <p className="font-display text-[17px] font-extrabold uppercase tracking-[0.04em] text-text">
              {champion}
            </p>
            <p className="hud-label mt-0.5 text-text-faint">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-px border-t border-line-1 bg-line-1">
          <div className="bg-surface pr-2 pt-3">
            <p className="hud-label text-text-faint">Games</p>
            <p className="mt-1.5 font-mono text-xl font-bold tabular-nums leading-none text-text">
              {games}
            </p>
          </div>
          <div className="bg-surface pl-3 pt-3">
            <p className="hud-label text-text-faint">Win rate</p>
            <p className={`mt-1.5 font-mono text-xl font-bold tabular-nums leading-none ${tone}`}>
              {Math.round(winRate)}%
            </p>
          </div>
        </div>
      </div>

      {target && (
        <div className="notch bg-hero-fade animate-hud-enter border border-border bg-surface px-[18px] py-4 [animation-delay:150ms]">
          <p className="hud-label text-text-faint">{"// Your number for this lesson"}</p>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span className="font-mono text-[30px] font-bold tabular-nums leading-none text-danger">
              {formatMetric(target.baseline, target.metric)}
            </span>
            <span className="font-mono text-sm text-text-faint">→</span>
            <span className="font-mono text-[30px] font-bold tabular-nums leading-none text-accent">
              {formatMetric(target.target, target.metric)}
            </span>
          </div>
          <p className="hud-label mt-2 text-text-faint">{target.label} · last 20 ranked</p>
          <p className="mt-3 text-[13px] leading-relaxed text-text-body">{target.instruction}</p>
        </div>
      )}
    </div>
  );
}
