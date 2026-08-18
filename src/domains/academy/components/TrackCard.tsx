import Link from "next/link";
import { Lock, RotateCcw, Star } from "lucide-react";
import { lessonId, trackMinutes } from "@/domains/academy/curriculum";
import type { LessonStatus, Track } from "@/domains/academy/types";

interface TrackCardProps {
  track: Track;
  statuses: Map<string, LessonStatus>;
  /** 0–1. Rendered as a meter across the top of the card. */
  completion: number;
}

const LEVEL_LABEL: Record<Track["level"], string> = {
  foundation: "Start here",
  core: "Core skill",
  advanced: "Advanced",
};

const DONE: readonly LessonStatus[] = ["completed", "mastered"];

export function TrackCard({ track, statuses, completion }: TrackCardProps): React.ReactElement {
  const done = track.lessons.filter((l) => DONE.includes(statuses.get(lessonId(l)) ?? "available"));
  const mastered = track.lessons.filter((l) => statuses.get(lessonId(l)) === "mastered").length;
  // A mastery the nightly check took back (ADR-027). Counted separately from `done` on purpose:
  // it is a lesson to redo, and folding it into the progress number would hide that.
  const review = track.lessons.filter((l) => statuses.get(lessonId(l)) === "review").length;

  return (
    <Link
      href={`/academy/${track.id}`}
      className="notch group flex flex-col border border-border bg-surface transition-colors hover:border-line-3"
    >
      <div className="h-1 w-full bg-surface-dark">
        <div className="h-full bg-accent" style={{ width: `${Math.round(completion * 100)}%` }} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="hud-label text-accent">{LEVEL_LABEL[track.level]}</span>
          <span className="font-mono text-[11px] text-text-muted">
            {done.length}/{track.lessons.length}
          </span>
        </div>

        <h3 className="mt-2.5 font-display text-lg font-bold uppercase tracking-[0.02em] text-text transition-colors group-hover:text-accent">
          {track.title}
        </h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-label text-text-muted">
          {track.tagline}
        </p>

        <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-text-body">
          {track.description}
        </p>

        <div className="mt-4 flex items-center gap-4 border-t border-line-1 pt-3">
          <span className="font-mono text-[11px] text-text-muted">
            {track.lessons.length} lessons
          </span>
          <span className="font-mono text-[11px] text-text-muted">{trackMinutes(track)} min</span>
          {mastered > 0 && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-accent">
              <Star className="h-3 w-3 fill-current" strokeWidth={2} />
              {mastered} mastered
            </span>
          )}
          {review > 0 && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-warning">
              <RotateCcw className="h-3 w-3" strokeWidth={2} />
              {review} to redo
            </span>
          )}
          {track.lessons.some((l) => l.access === "pro") && (
            <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-text-faint">
              <Lock className="h-3 w-3" strokeWidth={2} />
              Pro
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
