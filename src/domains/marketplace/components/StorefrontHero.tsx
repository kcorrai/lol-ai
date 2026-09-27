import Link from "next/link";
import { ArrowRight, BadgeCheck, HandCoins, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RankCrest } from "@/domains/marketplace/components/hud/RankCrest";
import { tierTint } from "@/domains/marketplace/components/hud/tierTone";

interface Props {
  coaches: number;
  checkedPct: number;
  sessionsRun: number;
  /** Up to three tiers actually held by coaches on this page, highest first. */
  tiers: string[];
}

const PROMISES = [
  { icon: ShieldCheck, text: "Rank read from their Riot account" },
  { icon: HandCoins, text: "Nothing charged until they accept" },
  { icon: BadgeCheck, text: "Money held until the session settles" },
];

/**
 * The storefront's opening argument.
 *
 * The crests on the right are the tiers of coaches who are really listed, not a
 * stock trio — a decorative Challenger crest over a page with no Challenger on it
 * would be the one dishonest picture on a page whose pitch is honesty.
 */
export function StorefrontHero({
  coaches,
  checkedPct,
  sessionsRun,
  tiers,
}: Props): React.ReactElement {
  const lead = tiers[0] ?? null;

  return (
    <section className="relative overflow-hidden border-b border-line-1">
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(760px 380px at 82% 38%, ${tierTint(lead, 0.14)}, transparent 70%), radial-gradient(900px 340px at 12% 0%, rgba(198,255,61,0.09), transparent 70%), var(--bg-hero-fade)`,
        }}
        aria-hidden
      />
      <span className="bg-scanline absolute inset-0" aria-hidden />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-5 pb-10 pt-12 md:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:pb-12 lg:pt-14">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent">
            <span className="h-1.5 w-1.5 animate-pulse bg-accent" aria-hidden />
            Human coaches · checked ranks
          </p>
          <h1 className="max-w-[18ch] font-display text-[34px] font-black uppercase leading-[0.98] tracking-[0.02em] text-text md:text-[48px]">
            Find a coach who has the <span className="text-accent">rank they claim</span>
          </h1>
          <p className="mt-5 max-w-[56ch] text-[15.5px] leading-relaxed text-text-body">
            Every rank on this page was read from the coach&apos;s own linked Riot account and is
            shown with the date we last checked it. Nobody here typed their rank into a box.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-[13.5px] text-text">
                <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/coaches/match">
                Find my coach
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <span className="text-[12.5px] text-text-muted">
              Six quick questions, or browse everyone below
            </span>
          </div>
        </div>

        <div className="grid gap-6">
          {tiers.length > 0 && (
            <div className="hidden items-end justify-center lg:flex" aria-hidden>
              {tiers.map((tier, i) => (
                <RankCrest
                  key={tier}
                  tier={tier}
                  size={i === 0 ? "xl" : "lg"}
                  className={
                    i === 0
                      ? "z-10 order-2 -mx-4"
                      : i === 1
                        ? "order-1 opacity-80"
                        : "order-3 opacity-80"
                  }
                />
              ))}
            </div>
          )}

          <dl className="grid grid-cols-3 border border-line-1 bg-surface-dark/70 backdrop-blur-sm">
            <Readout label="Coaches listed" value={String(coaches)} />
            <Readout label="Ranks checked" value={`${checkedPct}%`} accent bordered />
            <Readout label="Sessions run" value={String(sessionsRun)} bordered />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Readout({
  label,
  value,
  accent,
  bordered,
}: {
  label: string;
  value: string;
  accent?: boolean;
  bordered?: boolean;
}): React.ReactElement {
  return (
    <div
      className={bordered ? "border-l border-line-1 px-3 py-3.5 sm:px-4" : "px-3 py-3.5 sm:px-4"}
    >
      <dt className="font-mono text-[9px] uppercase leading-tight tracking-[0.16em] text-text-muted sm:text-[9.5px]">
        {label}
      </dt>
      <dd
        className={`mt-1.5 font-mono text-[26px] font-bold leading-none ${accent ? "text-accent" : "text-text"}`}
      >
        {value}
      </dd>
    </div>
  );
}
