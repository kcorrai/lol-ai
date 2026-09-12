import Link from "next/link";
import { Check, RotateCcw, Star } from "lucide-react";
import type { TranscriptLesson } from "@/domains/academy/services/transcriptService";

interface TranscriptPanelProps {
  title: string;
  /** Where the panel's own heading points. */
  href: string;
  /** "4/6" for a track; omitted for the champion list, which has no set to finish. */
  count?: string;
  note: string;
  /** 0–1. Omitted, no meter is drawn. */
  completion?: number;
  /** The certificate control, on a track that has earned one. */
  action?: React.ReactNode;
  lessons: TranscriptLesson[];
  /** Given, each row links to its lesson. */
  lessonHref?: (lesson: TranscriptLesson) => string;
  /** Formats the date column. */
  when: (lesson: TranscriptLesson) => string;
  index?: number;
}

function marker(status: TranscriptLesson["status"]): React.ReactElement {
  if (status === "mastered") {
    return <Star className="h-3.5 w-3.5 fill-current text-accent" strokeWidth={2} />;
  }
  if (status === "review") {
    return <RotateCcw className="h-3.5 w-3.5 text-warning" strokeWidth={2.5} />;
  }
  if (status === "completed") {
    return <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />;
  }
  return <span className="h-[7px] w-[7px] rounded-full border border-line-3" />;
}

/**
 * One block of the transcript: a track (or the champion list) and every lesson under it.
 *
 * The head carries the claim — how many read, how many proved — and the rows are the
 * evidence, each with the date it happened on.
 */
export function TranscriptPanel({
  title,
  href,
  count,
  note,
  completion,
  action,
  lessons,
  lessonHref,
  when,
  index = 0,
}: TranscriptPanelProps): React.ReactElement {
  const complete = completion === 1;

  return (
    <section
      style={{ animationDelay: `${index * 60}ms` }}
      className="notch animate-hud-enter overflow-hidden border border-border bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line-1 bg-surface-2 px-[18px] py-3.5">
        <span className="flex min-w-0 flex-wrap items-center gap-3">
          <Link
            href={href}
            className="font-display text-[15px] font-extrabold uppercase tracking-[0.06em] text-text transition-colors hover:text-accent"
          >
            {title}
          </Link>
          {count && (
            <span
              className={`font-mono text-[11px] tabular-nums ${
                complete ? "text-accent" : completion ? "text-warning" : "text-text-faint"
              }`}
            >
              {count}
            </span>
          )}
          <span className="hud-label text-text-faint">{note}</span>
        </span>

        <span className="flex items-center gap-3.5">
          {completion !== undefined && (
            <span className="block h-[5px] w-[120px] bg-surface-dark">
              <span
                className="block h-full animate-academy-bar bg-accent"
                style={{ width: `${Math.round(completion * 100)}%` }}
              />
            </span>
          )}
          {action}
        </span>
      </div>

      {lessons.map((lesson, i) => (
        <div
          key={lesson.lessonId}
          style={{ animationDelay: `${i * 22}ms` }}
          className="grid animate-academy-row grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-line-1 px-[18px] py-2.5 last:border-b-0"
        >
          <span className="flex h-4 w-4 items-center justify-center">{marker(lesson.status)}</span>

          {lessonHref ? (
            <Link
              href={lessonHref(lesson)}
              className={`min-w-0 truncate text-[13.5px] transition-colors hover:text-accent ${
                lesson.status === "available" ? "text-text-muted" : "text-text"
              }`}
            >
              {lesson.title}
            </Link>
          ) : (
            <span
              className={`min-w-0 truncate text-[13.5px] ${
                lesson.status === "available" ? "text-text-muted" : "text-text"
              }`}
            >
              {lesson.title}
            </span>
          )}

          <span className="flex items-center gap-3">
            {lesson.status === "review" && (
              <span className="font-mono text-[10px] uppercase tracking-label text-warning">
                Redo
              </span>
            )}
            <span className="w-[92px] text-right font-mono text-[10.5px] tracking-[0.1em] text-text-faint">
              {when(lesson) || "—"}
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
