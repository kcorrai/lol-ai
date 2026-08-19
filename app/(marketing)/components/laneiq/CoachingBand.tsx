import Link from "next/link";
import { SectionHead } from "./SectionHead";
import { EdgeSweep, HudStagger, HudStaggerItem } from "./motion";

/**
 * Two things the page never mentioned: that you can book a human, and that the
 * product has a team side. They share a band because they are the same answer to
 * two different readers — "the AI is not the only coach here".
 *
 * Replaces the pre-rebrand TeamPlanSection, which was off-system (rounded cards,
 * glow orbs, a "Most Popular" pill) and claimed a feature set nobody checked.
 */

interface Point {
  title: string;
  detail: string;
}

const COACH_POINTS: readonly Point[] = [
  {
    title: "Rank read from their own account",
    detail:
      "We check the coach's linked Riot account ourselves and stamp the date. Nobody types their rank in.",
  },
  {
    title: "Priced and scheduled up front",
    detail: "Hourly rate, what they coach and when they are free — before you message anyone.",
  },
  {
    title: "Booking and messaging in one place",
    detail: "Request a slot, agree it, talk to them, review it afterwards.",
  },
];

const TEAM_POINTS: readonly Point[] = [
  {
    title: "Every player on one screen",
    detail: "Rank, recent form, KDA and CS for the whole roster without opening five profiles.",
  },
  {
    title: "Coach and player roles",
    detail: "Coaches see the squad. Players see themselves.",
  },
  {
    title: "Reports per member",
    detail: "The same AI coaching each player gets alone, run across the roster.",
  },
];

function Column({
  kicker,
  headline,
  body,
  points,
  cta,
  href,
  accent,
}: {
  kicker: string;
  headline: string;
  body: string;
  points: readonly Point[];
  cta: string;
  href: string;
  accent?: boolean;
}): React.ReactElement {
  return (
    <div className="notch relative flex flex-col overflow-hidden border border-border bg-surface p-6 md:p-7">
      {accent ? <EdgeSweep /> : null}
      <span
        className={
          accent ? "font-mono text-[11px] uppercase tracking-label text-accent" : "hud-label"
        }
      >
        {kicker}
      </span>
      <h3 className="mt-2.5 max-w-[18ch] font-display text-[22px] font-extrabold uppercase leading-[1.14] text-text md:text-[25px]">
        {headline}
      </h3>
      <p className="mt-3 max-w-[46ch] text-[14.5px] leading-relaxed text-text-body">{body}</p>

      <HudStagger className="mt-5 grid gap-3.5">
        {points.map((p) => (
          <HudStaggerItem key={p.title}>
            <div className="grid grid-cols-[14px_1fr] items-start gap-3">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 bg-accent" />
              <div>
                <p className="text-[13.5px] font-semibold text-text">{p.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">{p.detail}</p>
              </div>
            </div>
          </HudStaggerItem>
        ))}
      </HudStagger>

      <Link
        href={href}
        className="mt-auto pt-6 font-mono text-[11px] uppercase tracking-label text-accent"
      >
        {cta} &rarr;
      </Link>
    </div>
  );
}

export function CoachingBand(): React.ReactElement {
  return (
    <section id="coaches" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead title="When you want a person" aside="Coaches · teams" />
        <div className="grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-2">
          <Column
            accent
            kicker="// Marketplace"
            headline="Book a coach whose rank we checked"
            body="A storefront of coaches you can filter by rank, role and price. Every rank badge on it was read from that coach's own linked Riot account on a date we show you."
            points={COACH_POINTS}
            cta="Browse coaches"
            href="/coaches"
          />
          <Column
            kicker="// Teams"
            headline="Or bring the whole roster"
            body="For academies, school leagues and five friends who queue together. One dashboard for the squad, the same coaching each player would get on their own."
            points={TEAM_POINTS}
            cta="See the Team plan"
            href="/pricing"
          />
        </div>
      </div>
    </section>
  );
}
