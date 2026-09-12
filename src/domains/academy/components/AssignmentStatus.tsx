"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, RotateCcw, Target, XCircle } from "lucide-react";
import { formatMetric } from "@/domains/academy/assignments";
import type {
  AssignmentStatus as Status,
  AssignmentView,
} from "@/domains/academy/services/assignmentService";
import { useRestartAssignment } from "@/hooks/useAcademyProgress";
import { Pips } from "@/domains/academy/components/Pips";

interface AssignmentStatusProps {
  assignment: AssignmentView;
  /** The lesson's own wording, which the stored row does not carry. */
  instruction: string;
}

const HEAD: Record<Status, { label: string; tone: string; Icon: typeof Target }> = {
  active: { label: "Field assignment in progress", tone: "text-warning", Icon: Target },
  passed: { label: "Mastered — you did it in game", tone: "text-accent", Icon: CheckCircle2 },
  failed: { label: "Not this time", tone: "text-danger", Icon: XCircle },
  expired: { label: "Assignment expired", tone: "text-warning", Icon: Clock },
};

const BORDER: Record<Status, string> = {
  // Amber while it is still being judged: this is the one panel on the page that is waiting
  // on the player to go and play, and it should not read as finished.
  active: "border-warning",
  passed: "border-acid-500 glow-accent-soft",
  failed: "border-line-2",
  expired: "border-line-2",
};

/**
 * The live state of a lesson's Proof of Practice. This is the panel that makes the Academy's
 * claim true: it is reading the player's actual ranked games, not asking them to self-report.
 */
export function AssignmentStatus({
  assignment,
  instruction,
}: AssignmentStatusProps): React.ReactElement {
  const router = useRouter();
  const restart = useRestartAssignment();
  const { label, tone, Icon } = HEAD[assignment.status];
  const resolved = assignment.status === "failed" || assignment.status === "expired";

  function tryAgain(): void {
    restart.mutate(assignment.lessonId, { onSuccess: () => router.refresh() });
  }

  return (
    <section
      className={`notch relative mt-[18px] animate-hud-enter overflow-hidden border bg-surface ${BORDER[assignment.status]}`}
    >
      {assignment.status === "active" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[16%] animate-quiz-sweep bg-[linear-gradient(90deg,transparent,rgba(255,194,75,0.09),transparent)] [animation-duration:5.4s] [animation-iteration-count:infinite]"
        />
      )}
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-1 px-5 py-3.5">
        <span
          className={`flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${tone}`}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          {"// "}
          {label}
        </span>
        <span className="ml-auto flex items-center gap-2.5">
          <Pips done={assignment.gamesObserved} total={assignment.gamesRequired} />
          <span className="font-mono text-[11.5px] tabular-nums text-text-muted">
            {assignment.gamesObserved}/{assignment.gamesRequired} ranked games
          </span>
        </span>
      </div>

      <div className="relative p-5">
        <p className="text-[14.5px] leading-relaxed text-text">{instruction}</p>

        <div className="mt-4 grid grid-cols-3 gap-px bg-line-1">
          <Stat label="Baseline" value={formatMetric(assignment.baseline, assignment.metric)} />
          <Stat
            label="Target"
            value={formatMetric(assignment.target, assignment.metric)}
            accent={assignment.status !== "failed"}
          />
          <Stat
            label={assignment.average === null ? "So far" : "You averaged"}
            value={
              assignment.average === null
                ? "—"
                : formatMetric(assignment.average, assignment.metric)
            }
            accent={assignment.status === "passed"}
            bad={assignment.status === "failed"}
          />
        </div>

        <p className="mt-2.5 font-mono text-[11px] text-text-faint">
          {assignment.position ? `${assignment.position} · ` : ""}
          {assignment.status === "active"
            ? `Judged on your first ${assignment.gamesRequired} ranked games after finishing this lesson. Expires after 14 days.`
            : `Judged on your first ${assignment.gamesRequired} ranked games after you finished this lesson.`}
        </p>

        {resolved && (
          <button
            type="button"
            onClick={tryAgain}
            disabled={restart.isPending}
            className="tag-cut mt-4 inline-flex h-9 items-center gap-2 border border-line-2 px-4 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-text transition-colors hover:border-acid-500 hover:text-accent disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            {restart.isPending ? "Starting…" : "Try again"}
          </button>
        )}
        {restart.isError && (
          <p className="mt-2 font-mono text-[11px] text-warning">
            Could not restart the assignment — reload and try again.
          </p>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
  bad,
}: {
  label: string;
  value: string;
  accent?: boolean;
  bad?: boolean;
}): React.ReactElement {
  const tone = bad ? "text-danger" : accent ? "text-accent" : "text-text";
  return (
    <div className="bg-surface px-4 py-3.5">
      <p className="hud-label text-text-faint">{label}</p>
      <p className={`mt-2 font-mono text-[22px] font-bold tabular-nums leading-none ${tone}`}>
        {value}
      </p>
    </div>
  );
}
