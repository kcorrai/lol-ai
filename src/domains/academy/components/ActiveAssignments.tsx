import Link from "next/link";
import { METRIC_LABEL, formatMetric } from "@/domains/academy/assignments";
import { getLessonById } from "@/domains/academy/curriculum";
import { Pips } from "@/domains/academy/components/Pips";
import { SectionHeading } from "@/domains/academy/components/SectionHeading";
import type { AssignmentView } from "@/domains/academy/services/assignmentService";

/**
 * Open Proof of Practice assignments across the whole curriculum. This is the one place a
 * player can see everything the Academy is currently watching their matches for — so it is
 * built as a board with one row per assignment, not a list of links.
 */
export function ActiveAssignments({
  assignments,
}: {
  assignments: AssignmentView[];
}): React.ReactElement | null {
  if (assignments.length === 0) return null;

  return (
    <section className="mt-6">
      <SectionHeading
        label={`In the field · ${assignments.length} running`}
        note="Measured in your own ranked games"
      />

      <ul className="notch mt-3 overflow-hidden border border-border bg-surface">
        {assignments.map((assignment, i) => {
          const lesson = getLessonById(assignment.lessonId);
          if (!lesson) return null;

          const started = assignment.gamesObserved > 0;

          return (
            <li key={assignment.lessonId}>
              <Link
                href={`/academy/${lesson.trackId}/${lesson.slug}`}
                style={{ animationDelay: `${i * 28}ms` }}
                className={`group grid animate-academy-row grid-cols-[24px_minmax(0,1fr)] items-center gap-3.5 border-b border-line-1 px-[18px] py-[13px] transition-colors hover:bg-surface-2 sm:grid-cols-[24px_minmax(0,1fr)_160px] ${
                  started ? "border-l-2 border-l-accent" : "border-l-2 border-l-transparent"
                }`}
              >
                <span
                  aria-hidden
                  className={
                    started
                      ? "glow-accent-soft block h-[7px] w-[7px] bg-accent"
                      : "block h-[7px] w-[7px] border border-line-3"
                  }
                />

                <span className="min-w-0">
                  <span className="block truncate font-display text-[14px] font-bold uppercase tracking-[0.04em] text-text transition-colors group-hover:text-accent">
                    {lesson.title}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] tabular-nums text-text-muted">
                      {formatMetric(assignment.baseline, assignment.metric)}
                    </span>
                    <span className="font-mono text-[11px] text-text-faint">→</span>
                    <span className="font-mono text-[11px] tabular-nums text-accent">
                      {formatMetric(assignment.target, assignment.metric)}
                    </span>
                    <span className="tag-cut whitespace-nowrap border border-line-2 bg-surface-dark px-[7px] py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-text-muted">
                      {METRIC_LABEL[assignment.metric]}
                    </span>
                    {assignment.position && (
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-text-faint">
                        {assignment.position}
                      </span>
                    )}
                  </span>
                </span>

                <span className="col-span-2 flex items-center justify-end gap-2.5 sm:col-span-1">
                  <Pips done={assignment.gamesObserved} total={assignment.gamesRequired} />
                  <span className="w-7 text-right font-mono text-[11.5px] tabular-nums text-text-muted">
                    {assignment.gamesObserved}/{assignment.gamesRequired}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
