import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import type { Placement, SignalVerdict } from "@/domains/academy/placement";
import type { Recommendation } from "@/domains/academy/recommendation";

interface NextUpPanelProps {
  recommendation: Recommendation | null;
  placement: Placement;
  personalised: boolean;
}

const VERDICT_TONE: Record<SignalVerdict, string> = {
  weak: "text-danger",
  ok: "text-text",
  strong: "text-accent",
};

const VERDICT_BAR: Record<SignalVerdict, string> = {
  weak: "bg-danger",
  ok: "bg-fg-2",
  strong: "bg-accent",
};

/**
 * The hub's one personalised panel. When we have the player's matches it names the
 * reading that produced the recommendation — a lesson suggestion the player cannot
 * trace back to their own games is just a table of contents.
 */
export function NextUpPanel({
  recommendation,
  placement,
  personalised,
}: NextUpPanelProps): React.ReactElement | null {
  if (!recommendation) return null;

  const { lesson, reason } = recommendation;

  return (
    <section className="notch-lg glow-accent-soft relative animate-hud-enter overflow-hidden border border-acid-500 bg-surface">
      {/* A slow pass of light across the panel that carries the one thing to do next. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[16%] animate-quiz-sweep bg-[linear-gradient(90deg,transparent,rgba(198,255,61,0.1),transparent)] [animation-duration:5s] [animation-iteration-count:infinite]"
      />

      <div className="relative flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">
            <Target className="h-[15px] w-[15px]" strokeWidth={2} />
            Next up for you
          </p>
          <h2 className="mt-2.5 font-display text-2xl font-extrabold uppercase tracking-[0.03em] text-text">
            {lesson.title}
          </h2>
          <p className="mt-2 max-w-[56ch] text-[14.5px] leading-relaxed text-text-body">{reason}</p>
        </div>

        <Link
          href={`/academy/${lesson.trackId}/${lesson.slug}`}
          className="tag-cut btn-glow flex h-[42px] shrink-0 items-center gap-2 self-start bg-accent px-5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 md:self-auto"
        >
          Start lesson
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      {personalised && placement.signals.length > 0 && (
        <div className="relative grid grid-cols-2 gap-px border-t border-line-1 bg-line-1 md:grid-cols-4">
          {placement.signals.map((signal, i) => (
            <div key={signal.label} className="bg-surface px-[18px] py-3.5">
              <p className="hud-label text-text-faint">{signal.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`font-mono text-[21px] font-bold tabular-nums leading-none ${VERDICT_TONE[signal.verdict]}`}
                >
                  {signal.value}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
                  {signal.verdict}
                </span>
              </div>
              <div className="mt-2.5 h-[3px] bg-surface-dark">
                <span
                  className={`block h-full animate-academy-bar ${VERDICT_BAR[signal.verdict]}`}
                  style={{
                    width: `${Math.round(signal.strength * 100)}%`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!personalised && (
        <div className="relative border-t border-line-1 px-5 py-3 md:px-6">
          <p className="text-[12.5px] text-text-muted">
            <Link href="/settings/accounts" className="text-accent hover:underline">
              Connect your Riot account
            </Link>{" "}
            and the Academy reads your last 20 games to pick the lesson that fixes what is actually
            costing you games.
          </p>
        </div>
      )}
    </section>
  );
}
