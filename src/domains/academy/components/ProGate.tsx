import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Shown in place of the second half of a pro lesson. The free half is real teaching, not a
 * teaser — the gate sits after the concept has been explained and before the drills that
 * turn it into a habit.
 */
export function ProGate({ lessonTitle }: { lessonTitle: string }): React.ReactElement {
  return (
    <section className="notch relative mt-8 border border-line-2 bg-surface p-6">
      <div className="bg-protect-bottom pointer-events-none absolute -top-16 left-0 h-16 w-full" />

      <p className="flex items-center gap-2 hud-label text-accent">
        <Lock className="h-3.5 w-3.5" strokeWidth={2} />
        The rest of this lesson is Pro
      </p>

      <h2 className="mt-2.5 font-display text-lg font-bold uppercase tracking-[0.02em] text-text">
        {lessonTitle} — the practical half
      </h2>

      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-text-body">
        Everything above is the concept. Behind the gate: the situations where it applies,
        the mistake that costs the most, the interactive drills, and a field assignment
        measured against your own ranked games.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href="/pricing"
          className="tag-cut btn-glow inline-flex h-10 items-center bg-accent px-5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
        >
          See Pro
        </Link>
        <Link
          href="/academy"
          className="font-mono text-[11px] uppercase tracking-label text-text-muted hover:text-text"
        >
          Back to the free track →
        </Link>
      </div>
    </section>
  );
}
