import { BarChart2, Swords, TrendingUp } from "lucide-react";
import { SectionHead } from "../components/laneiq/SectionHead";
import { HudStagger, HudStaggerItem } from "../components/laneiq/motion";

/**
 * The three reports the product can actually produce.
 *
 * Three, and these three, because that is the whole of `ReportType` in `prisma/schema.prisma`
 * — a marketing page that listed a fourth would be describing a feature the generate endpoint
 * would reject. The names and the icons are the ones `ReportList.tsx` already draws inside the
 * application, so a player recognises what they were sold when they get there.
 */

interface ReportKind {
  /** Matches the `ReportType` enum value, so a rename in the schema is visible here. */
  id: "session_review" | "champion_focus" | "climb_roadmap";
  label: string;
  icon: React.ElementType;
  tone: string;
  question: string;
  body: string;
}

const KINDS: readonly ReportKind[] = [
  {
    id: "session_review",
    label: "Session Review",
    icon: BarChart2,
    tone: "text-accent",
    question: "What went wrong tonight?",
    body: "A block of games read together. One session is where a habit shows up as a habit rather than as a bad game — the same mistake in four matches is a finding, in one it is variance.",
  },
  {
    id: "champion_focus",
    label: "Champion Focus",
    icon: Swords,
    tone: "text-warning",
    question: "Why is this one champion worse for me?",
    body: "Your games on a single champion, pulled out of the rest even when they are not the most recent. What that champion asks of you, and which part of it you are not doing.",
  },
  {
    id: "climb_roadmap",
    label: "Climb Roadmap",
    icon: TrendingUp,
    tone: "text-success",
    question: "What do I work on next?",
    body: "The longer read: where the LP is going, which of your problems is costing the most of it, and what to fix first. The one to run when the answer to a session is 'that was fine'.",
  },
];

export function ReportTypes(): React.ReactElement {
  return (
    <section className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead title="Three reports, three questions" aside="All it can produce" />

        <HudStagger className="grid gap-3.5 lg:grid-cols-3">
          {KINDS.map((kind) => (
            <HudStaggerItem key={kind.id}>
              <div className="notch h-full border border-border bg-surface p-6">
                <kind.icon aria-hidden className={`h-5 w-5 ${kind.tone}`} strokeWidth={1.75} />
                <p className="mt-3.5 font-display text-[16px] font-extrabold uppercase tracking-[0.05em] text-text">
                  {kind.label}
                </p>
                <p className="mt-1.5 font-mono text-[11.5px] uppercase tracking-label text-text-faint">
                  {kind.question}
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-text-muted">{kind.body}</p>
              </div>
            </HudStaggerItem>
          ))}
        </HudStagger>
      </div>
    </section>
  );
}
