import Link from "next/link";
import { formatMetric } from "@/domains/academy/assignments";
import type { AssignmentTarget } from "@/domains/academy/assignments";
import type { Lesson, LessonStatus } from "@/domains/academy/types";

interface LessonRailProps {
  /** Every lesson in the track, in teaching order. */
  lessons: Lesson[];
  trackId: string;
  trackTitle: string;
  /** Slug of the lesson being read. */
  current: string;
  statuses: Map<string, LessonStatus>;
  /** The number this lesson is asking the player to move, when we can measure it. */
  target: AssignmentTarget | null;
}

const DONE: readonly LessonStatus[] = ["completed", "mastered"];

/**
 * The column beside a lesson: where this one sits in the track, and the player's own number
 * for it.
 *
 * Both answer the question a reader has half way down a lesson — "why am I reading this?" —
 * without interrupting the lesson itself to do it.
 */
export function LessonRail({
  lessons,
  trackId,
  trackTitle,
  current,
  statuses,
  target,
}: LessonRailProps): React.ReactElement {
  // How far the baseline already is toward the target, as a meter. A baseline past the target
  // is a player who is already there — the bar fills rather than overflowing.
  const distance = target ? Math.max(0, Math.min(1, target.baseline / (target.target || 1))) : 0;

  return (
    <div className="grid gap-3.5 lg:sticky lg:top-4">
      <nav className="notch animate-hud-enter border border-border bg-surface px-[18px] py-4 [animation-delay:90ms]">
        <p className="hud-label text-text-faint">{"// This track"}</p>
        <p className="mt-1 font-display text-[13px] font-bold uppercase tracking-[0.04em] text-text-muted">
          {trackTitle}
        </p>
        <div className="mt-3 grid gap-0.5">
          {lessons.map((lesson) => {
            const on = lesson.slug === current;
            const done = DONE.includes(statuses.get(`${trackId}/${lesson.slug}`) ?? "available");
            return (
              <Link
                key={lesson.slug}
                href={`/academy/${trackId}/${lesson.slug}`}
                aria-current={on ? "page" : undefined}
                className={`flex items-center gap-2.5 border-l-2 px-2.5 py-2 transition-colors ${
                  on
                    ? "border-l-accent bg-[var(--surface-accent)]"
                    : "border-l-transparent hover:bg-surface-2"
                }`}
              >
                <span
                  aria-hidden
                  className={`block h-1.5 w-1.5 shrink-0 bg-accent ${
                    on ? "opacity-100" : done ? "opacity-70" : "opacity-30"
                  }`}
                />
                <span className={`truncate text-[13px] ${on ? "text-accent" : "text-text-body"}`}>
                  {lesson.title}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

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
          <div className="mt-3.5 h-[5px] bg-surface-dark">
            <span
              className="block h-full animate-academy-bar bg-accent"
              style={{ width: `${Math.round(distance * 100)}%` }}
            />
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-text-body">{target.instruction}</p>
        </div>
      )}
    </div>
  );
}
