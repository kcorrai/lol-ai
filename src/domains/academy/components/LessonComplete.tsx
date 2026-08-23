"use client";

import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { formatMetric, type AssignmentTarget } from "@/domains/academy/assignments";
import type { LessonScore } from "@/domains/academy/drills/scoring";

interface LessonCompleteProps {
  score: LessonScore;
  assignment: AssignmentTarget | null;
  next: { href: string; title: string } | null;
  isAuthenticated: boolean;
  saving: boolean;
  saveFailed: boolean;
  /** True when a stored assignment is already being tracked below this panel. */
  liveAssignment: boolean;
  /** XP this attempt earned. Zero for a lesson that has already been paid for. */
  xpAwarded: number;
}

/**
 * Shown once every drill on the page has been answered. The field assignment is the point
 * of the lesson — the score is only the receipt for having read it.
 */
export function LessonComplete({
  score,
  assignment,
  next,
  isAuthenticated,
  saving,
  saveFailed,
  liveAssignment,
  xpAwarded,
}: LessonCompleteProps): React.ReactElement {
  return (
    <section className="notch glow-accent-soft mt-10 border border-acid-500 bg-surface">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line-1 px-5 py-3.5">
        <span className="hud-label text-accent">Lesson complete</span>
        <span className="font-mono text-sm font-bold text-text">
          {score.correct}/{score.total} drills
        </span>
        {xpAwarded > 0 && (
          <span className="font-mono text-[11px] font-bold text-accent">+{xpAwarded} XP</span>
        )}
        {saving && <span className="font-mono text-[11px] text-text-muted">Saving…</span>}
        {saveFailed && (
          <span className="font-mono text-[11px] text-warning">
            Progress could not be saved — reload and try again
          </span>
        )}
      </div>

      <div className="p-5">
        <p className="hud-label flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          Field assignment
        </p>

        {liveAssignment ? (
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-text">
            Your assignment is live below — the Academy is now watching your next ranked games and
            will mark this lesson mastered when you hit the target.
          </p>
        ) : assignment ? (
          <>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-text">
              {assignment.instruction}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-px bg-line-1">
              <Stat
                label="Your baseline"
                value={formatMetric(assignment.baseline, assignment.metric)}
              />
              <Stat
                label="Target"
                value={formatMetric(assignment.target, assignment.metric)}
                accent
              />
              <Stat label="Over" value={`${assignment.games} games`} />
            </div>
            <p className="mt-2.5 font-mono text-[11px] text-text-faint">
              {assignment.label} · measured from your own last games
            </p>
          </>
        ) : (
          <p className="mt-2.5 text-[14px] leading-relaxed text-text-body">
            {isAuthenticated
              ? "Play a few ranked games and sync, and the Academy will set this assignment against your own numbers and judge it from your matches."
              : "Sign in and connect your Riot account to get this assignment measured against your own ranked games."}
          </p>
        )}

        {next && (
          <Link
            href={next.href}
            className="tag-cut btn-glow mt-5 inline-flex h-10 items-center gap-2 bg-accent px-5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
          >
            Next: {next.title}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}): React.ReactElement {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="hud-label">{label}</p>
      <p className={`mt-1 font-mono text-base font-bold ${accent ? "text-accent" : "text-text"}`}>
        {value}
      </p>
    </div>
  );
}
