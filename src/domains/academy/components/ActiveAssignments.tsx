import Link from "next/link";
import { Target } from "lucide-react";
import { formatMetric } from "@/domains/academy/assignments";
import { getLessonById } from "@/domains/academy/curriculum";
import type { AssignmentView } from "@/domains/academy/services/assignmentService";

/**
 * Open Proof of Practice assignments across the whole curriculum. This is the one place a
 * player can see everything the Academy is currently watching their matches for.
 */
export function ActiveAssignments({
  assignments,
}: {
  assignments: AssignmentView[];
}): React.ReactElement | null {
  if (assignments.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3.5">
        <span className="hud-label">{"// In the field"}</span>
        <span className="h-px flex-1 bg-line-1" />
      </div>

      <ul className="mt-5 flex flex-col gap-px bg-line-1">
        {assignments.map((assignment) => {
          const lesson = getLessonById(assignment.lessonId);
          if (!lesson) return null;

          const progress = assignment.gamesObserved / assignment.gamesRequired;

          return (
            <li key={assignment.lessonId}>
              <Link
                href={`/academy/${lesson.trackId}/${lesson.slug}`}
                className="group flex flex-wrap items-center gap-x-5 gap-y-2 bg-surface p-4 transition-colors hover:bg-surface-2 md:p-5"
              >
                <Target className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />

                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[14px] font-bold uppercase tracking-[0.02em] text-text transition-colors group-hover:text-accent">
                    {lesson.title}
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] text-text-muted">
                    {formatMetric(assignment.baseline, assignment.metric)} →{" "}
                    {formatMetric(assignment.target, assignment.metric)} ·{" "}
                    {assignment.position ? `${assignment.position} · ` : ""}
                    {assignment.gamesRequired} ranked games
                  </span>
                </span>

                <span className="flex w-32 shrink-0 items-center gap-2.5">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-dark">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">
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
