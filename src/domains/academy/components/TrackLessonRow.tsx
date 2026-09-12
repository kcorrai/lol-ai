import Link from "next/link";
import { Check, Lock, RotateCcw, Star } from "lucide-react";
import { Pips } from "@/domains/academy/components/Pips";
import type { AssignmentView } from "@/domains/academy/services/assignmentService";
import type { Lesson, LessonStatus } from "@/domains/academy/types";

interface TrackLessonRowProps {
  lesson: Lesson;
  trackId: string;
  status: LessonStatus;
  /** Position in the track, for the number shown before it is finished. */
  index: number;
  /** The running field assignment for this lesson, when one is being judged. */
  assignment?: AssignmentView;
}

const DONE: readonly LessonStatus[] = ["completed", "mastered"];

/**
 * One lesson on a track page: where it sits in the order, what it teaches, and whether the
 * player has done it — read, or proved in their own games, which are different claims.
 */
export function TrackLessonRow({
  lesson,
  trackId,
  status,
  index,
  assignment,
}: TrackLessonRowProps): React.ReactElement {
  const done = DONE.includes(status);
  const mastered = status === "mastered";
  // `review` is a mastery the nightly check took back (ADR-027) — a lesson to redo, so it reads
  // as unfinished here rather than as a lesser kind of done.
  const review = status === "review";

  return (
    <Link
      href={`/academy/${trackId}/${lesson.slug}`}
      style={{ animationDelay: `${index * 35}ms` }}
      className={`group grid animate-academy-row grid-cols-[30px_minmax(0,1fr)] items-start gap-4 border-b border-line-1 px-5 py-4 transition-colors hover:bg-surface-2 sm:grid-cols-[30px_minmax(0,1fr)_88px] ${
        done ? "border-l-2 border-l-accent" : "border-l-2 border-l-transparent"
      }`}
    >
      <span
        className={`tag-cut grid h-[30px] w-[30px] place-items-center font-mono text-[12px] font-bold ${
          mastered
            ? "glow-accent-soft border border-acid-500 bg-accent text-background"
            : review
              ? "border border-warning text-warning"
              : done
                ? "border border-acid-500 bg-accent text-background"
                : "border border-line-2 bg-surface-dark text-text-muted"
        }`}
      >
        {mastered ? (
          <Star className="h-4 w-4 fill-current" strokeWidth={2} />
        ) : review ? (
          <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
        ) : done ? (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          index + 1
        )}
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2.5">
          <span
            className={`font-display text-[17px] font-extrabold uppercase tracking-[0.03em] transition-colors group-hover:text-accent ${
              done ? "text-text" : "text-text-body"
            }`}
          >
            {lesson.title}
          </span>
          {lesson.access === "pro" && (
            <span className="tag-cut flex items-center gap-1 border border-warning bg-warning/10 px-[7px] py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-warning">
              <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
              Pro
            </span>
          )}
          {mastered && (
            <span className="font-mono text-[10px] uppercase tracking-label text-accent">
              Mastered
            </span>
          )}
          {status === "in_progress" && (
            <span className="font-mono text-[10px] uppercase tracking-label text-warning">
              In progress
            </span>
          )}
          {/* Says the measurement moved, never that the player failed. */}
          {review && (
            <span className="font-mono text-[10px] uppercase tracking-label text-warning">
              Numbers slipped — redo
            </span>
          )}
        </span>
        <span className="mt-2 block max-w-[74ch] text-[14px] leading-relaxed text-text-body">
          {lesson.summary}
        </span>
      </span>

      <span className="col-span-2 grid justify-items-end gap-[7px] sm:col-span-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-faint">
          {lesson.minutes} min
        </span>
        {assignment && <Pips done={assignment.gamesObserved} total={assignment.gamesRequired} />}
      </span>
    </Link>
  );
}
