import Link from "next/link";
import { Lock, RotateCcw, Star } from "lucide-react";
import { lessonId, trackMinutes } from "@/domains/academy/curriculum";
import { ROLE_LABEL } from "@/domains/academy/roles";
import { ArtBackdrop } from "@/domains/academy/components/ArtBackdrop";
import type { LessonStatus, Track } from "@/domains/academy/types";

interface TrackCardProps {
  track: Track;
  statuses: Map<string, LessonStatus>;
  /** 0–1. Rendered as a meter across the top of the card. */
  completion: number;
  /** Marks the one role path that belongs to this player's own role. */
  yours?: boolean;
  /** Card index, so a grid of them arrives in sequence rather than all at once. */
  index?: number;
}

const LEVEL_LABEL: Record<Track["level"], string> = {
  foundation: "Start here",
  core: "Core skill",
  advanced: "Advanced",
};

const DONE: readonly LessonStatus[] = ["completed", "mastered"];

export function TrackCard({
  track,
  statuses,
  completion,
  yours = false,
  index = 0,
}: TrackCardProps): React.ReactElement {
  const done = track.lessons.filter((l) => DONE.includes(statuses.get(lessonId(l)) ?? "available"));
  const mastered = track.lessons.filter((l) => statuses.get(lessonId(l)) === "mastered").length;
  // A mastery the nightly check took back (ADR-027). Counted separately from `done` on purpose:
  // it is a lesson to redo, and folding it into the progress number would hide that.
  const review = track.lessons.filter((l) => statuses.get(lessonId(l)) === "review").length;

  const complete = done.length === track.lessons.length;
  const kind = yours ? "Your role" : track.role ? ROLE_LABEL[track.role] : LEVEL_LABEL[track.level];

  return (
    <Link
      href={`/academy/${track.id}`}
      style={{ animationDelay: `${index * 55}ms` }}
      className={`notch group relative animate-hud-enter overflow-hidden bg-surface transition-colors ${
        complete ? "border border-acid-500/40" : "border border-border"
      } hover:border-line-3`}
    >
      <ArtBackdrop
        champion={track.art}
        focus="60% 16%"
        opacity={0.26}
        sizes="(max-width: 1240px) 100vw, 620px"
        scanline={false}
      />

      {/* Progress reads before anything else on the card, so it is the top edge itself. */}
      <span className="absolute inset-x-0 top-0 z-10 h-0.5 bg-surface-dark">
        <span
          className="block h-full animate-academy-bar bg-accent"
          style={{ width: `${Math.round(completion * 100)}%`, animationDelay: `${index * 50}ms` }}
        />
      </span>

      <div className="relative flex flex-1 flex-col px-[22px] pb-[18px] pt-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`tag-cut whitespace-nowrap border px-[7px] py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] ${
              complete
                ? "border-acid-500 bg-[var(--surface-accent)] text-accent"
                : "border-line-2 bg-surface-dark text-text-muted"
            }`}
          >
            {kind}
          </span>
          <span
            className={`font-mono text-[12.5px] tabular-nums ${
              complete ? "text-accent" : done.length > 0 ? "text-warning" : "text-text-faint"
            }`}
          >
            {done.length}/{track.lessons.length}
          </span>
        </div>

        <h3 className="mt-[13px] font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text transition-colors group-hover:text-accent">
          {track.title}
        </h3>
        <p className="mt-[7px] font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
          {track.tagline}
        </p>

        <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-text-body">
          {track.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-1 pt-3.5">
          <span className="hud-label text-text-faint">
            {track.lessons.length} lessons · {trackMinutes(track)} min
          </span>
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
          <span className="ml-auto flex items-center gap-2">
            {track.lessons.some((l) => l.access === "pro") && (
              <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-warning">
                <Lock className="h-3 w-3" strokeWidth={2} />
                Pro
              </span>
            )}
            <span className="font-mono text-[12px] text-text-faint">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
