import Link from "next/link";
import { ArrowRight, Radar } from "lucide-react";
import type { Placement } from "@/domains/academy/placement";
import type { Recommendation } from "@/domains/academy/recommendation";

interface NextUpPanelProps {
  recommendation: Recommendation | null;
  placement: Placement;
  personalised: boolean;
}

const VERDICT_TONE = {
  weak: "text-danger",
  ok: "text-text-body",
  strong: "text-accent",
} as const;

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
    <section className="notch glow-accent-soft border border-acid-500 bg-surface">
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="hud-label flex items-center gap-2">
            <Radar className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
            Next up for you
          </p>
          <h2 className="mt-2 font-display text-xl font-bold uppercase tracking-[0.02em] text-text">
            {lesson.title}
          </h2>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-text-body">{reason}</p>
        </div>

        <Link
          href={`/academy/${lesson.trackId}/${lesson.slug}`}
          className="tag-cut btn-glow flex h-10 shrink-0 items-center gap-2 self-start bg-accent px-5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 md:self-auto"
        >
          Start lesson
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      {personalised && placement.signals.length > 0 && (
        <div className="grid grid-cols-2 gap-px border-t border-line-1 bg-line-1 md:grid-cols-4">
          {placement.signals.map((signal) => (
            <div key={signal.label} className="bg-surface px-5 py-3">
              <p className="hud-label">{signal.label}</p>
              <p className={`mt-1 font-mono text-sm font-bold ${VERDICT_TONE[signal.verdict]}`}>
                {signal.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {!personalised && (
        <div className="border-t border-line-1 px-5 py-3 md:px-6">
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
