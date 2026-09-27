import Link from "next/link";
import { ArrowRight, CalendarCheck, MessageCircleQuestion, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CoachCard } from "@/domains/marketplace/types";
import { CoachCardTile } from "@/domains/marketplace/components/CoachCardTile";

const STEPS = [
  {
    icon: Search,
    title: "Pick a coach whose rank is real",
    body: "Every rank is read from the coach's own Riot account and dated. Filter by role, rank, language and price — or answer six questions and let us narrow it.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Ask first, then request",
    body: "Message a coach before you book. When you are ready, pick a time, tick the games you want looked at and say what you want out of it.",
  },
  {
    icon: CalendarCheck,
    title: "Learn in your own games",
    body: "The coach reads your match history before you meet, works through your replays, and you book the next session in one click.",
  },
];

/** "How it works" — the section's own front door, for a visitor who arrived here first. */
export function HowItWorks(): React.ReactElement {
  return (
    <section className="mt-14">
      <h2 className="font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text md:text-[26px]">
        How LaneIQ Coaching works
      </h2>
      <ol className="mt-5 grid gap-3.5 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="notch border border-border bg-surface p-5">
            <span className="flex items-center gap-2.5">
              <span className="font-mono text-[12px] font-bold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Icon className="h-4 w-4 text-accent" aria-hidden />
            </span>
            <h3 className="mt-3 text-[15px] font-semibold text-text">{title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-text-body">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Coaches too new to have a rating, shown for being new.
 *
 * Ranked search puts them last; without a place like this a new coach never
 * gets the first sessions that would earn them a rating.
 */
export function NewCoachesStrip({ coaches }: { coaches: CoachCard[] }): React.ReactElement | null {
  if (coaches.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text md:text-[26px]">
        New on LaneIQ
      </h2>
      <p className="mt-2 text-[13.5px] text-text-muted">
        Checked ranks, no reviews yet — often the easiest calendars to get into.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.map((coach) => (
          <CoachCardTile key={coach.slug} coach={coach} />
        ))}
      </div>
    </section>
  );
}

/** The supply side's way in, at the foot of the storefront. */
export function CoachOnLaneIq(): React.ReactElement {
  return (
    <section className="notch bg-hero-fade mt-14 flex flex-wrap items-center justify-between gap-6 border border-border bg-surface px-6 py-7 md:px-8">
      <div className="max-w-[60ch]">
        <h2 className="font-display text-[20px] font-extrabold uppercase tracking-[0.03em] text-text md:text-[24px]">
          Coach on LaneIQ
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-text-body">
          Link your Riot account and your rank is checked for you. Set your own prices and hours,
          offer a short trial, and see your students&apos; games before every session.
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href="/coach/apply">
          Become a coach
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
