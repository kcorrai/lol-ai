import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { getCoachProfilePage, isScheduled } from "@/domains/marketplace";
import { ListingCard } from "@/domains/marketplace/components/ListingCard";
import { coachProfileJsonLd } from "@/domains/marketplace/jsonLd";
import { regionLabel } from "@/lib/riot/regions";
import { tierColorClass } from "@/lib/riot/rankDisplay";
import { formatRank } from "@/domains/marketplace/rank";
import { formatMoney } from "@/domains/marketplace/money";
import { languageLabel, roleLabel } from "@/domains/marketplace/components/options";
import { CoachPortrait } from "@/domains/marketplace/components/hud/CoachPortrait";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { BookingSteps } from "@/domains/marketplace/components/BookingSteps";
import { NextSlotCard } from "@/domains/marketplace/components/NextSlotCard";
import { CoachReviewCard } from "@/domains/marketplace/components/CoachReviewCard";

export const revalidate = 300;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const coach = await getCoachProfilePage(params.slug);
  if (!coach) return { title: "Coach not found" };

  return {
    title: `${coach.displayName} — League of Legends Coach`,
    description: coach.headline,
    alternates: { canonical: `/coaches/${params.slug}` },
  };
}

// The public profile: the page the whole section is trying to get found on, and
// the one where a student decides whether to trust a stranger with money.
export default async function CoachProfilePage({ params }: Props) {
  const coach = await getCoachProfilePage(params.slug);
  if (!coach) notFound();

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg"}/coaches/${params.slug}`;
  const scheduledListing = coach.listings.find((l) => isScheduled(l.kind)) ?? null;
  const cheapest = coach.listings.reduce<number | null>(
    (min, l) => (min === null || l.priceCents < min ? l.priceCents : min),
    null
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coachProfileJsonLd({ coach, url })) }}
      />

      <section className="relative overflow-hidden border-b border-line-1">
        <span className="bg-hero-fade absolute inset-0" aria-hidden />
        <span className="bg-scanline absolute inset-0" aria-hidden />

        <div className="relative mx-auto max-w-[1240px] px-5 py-7 md:px-8">
          <nav
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-faint"
            aria-label="Breadcrumb"
          >
            <Link href="/coaches" className="text-text-muted hover:text-accent">
              Coaching
            </Link>{" "}
            /{" "}
            <Link href="/coaches" className="text-text-muted hover:text-accent">
              Coaches
            </Link>{" "}
            / <span className="text-text-body">{coach.displayName}</span>
          </nav>

          <div className="mt-4 flex items-center gap-5">
            <CoachPortrait name={coach.displayName} tier={coach.badge?.tier} size="lg" />
            <div className="min-w-0">
              <h1 className="font-display text-[36px] font-black uppercase leading-[0.96] tracking-[0.02em] text-text md:text-[44px]">
                {coach.displayName}
              </h1>
              <p className="mt-2.5 max-w-[56ch] text-[15px] text-text-body">{coach.headline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {coach.roles.map((role) => (
                  <Tag key={role} accent>
                    {roleLabel(role)}
                  </Tag>
                ))}
                {coach.regions.map((region) => (
                  <Tag key={region}>{regionLabel(region)}</Tag>
                ))}
                {coach.languages.map((lang) => (
                  <Tag key={lang}>{languageLabel(lang)}</Tag>
                ))}
              </div>
            </div>
          </div>

          {/* The verified rank, given the weight it deserves: this is the one
              claim on the page nobody typed in. */}
          <div className="notch relative mt-5 flex flex-wrap items-center gap-4 border border-accent/30 bg-surface-dark px-5 py-3.5">
            {coach.badge ? (
              <>
                <span className="flex items-center gap-2.5 text-accent">
                  {coach.badge.stale ? (
                    <ShieldAlert className="h-5 w-5 text-warning" aria-hidden />
                  ) : (
                    <ShieldCheck className="h-5 w-5" aria-hidden />
                  )}
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em]">
                    Checked by LaneIQ
                  </span>
                </span>
                <span className="h-6 w-px bg-line-1" aria-hidden />
                <span
                  className={`font-mono text-xl font-bold tracking-[0.05em] ${tierColorClass(coach.badge.tier)}`}
                >
                  {formatRank({
                    tier: coach.badge.tier,
                    division: coach.badge.division,
                    leaguePoints: coach.badge.leaguePoints,
                  })}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                  {coach.badge.peakTier &&
                    `peak ${formatRank({ tier: coach.badge.peakTier, division: coach.badge.peakDivision ?? "I" })} · `}
                  read from a linked Riot account &middot;{" "}
                  {coach.badge.stale ? "needs a refresh" : `checked ${day(coach.badge.checkedAt)}`}
                </span>
              </>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                No rank checked for this coach yet
              </span>
            )}

            <span className="ml-auto flex gap-6">
              <MarketStat label="Sessions" value={String(coach.sessionsCompleted)} />
              <MarketStat
                label="Rating"
                value={coach.rating === null ? "—" : coach.rating.toFixed(1)}
                unit={coach.rating === null ? "new coach" : `(${coach.ratingCount})`}
                tone={coach.rating === null ? "default" : "accent"}
              />
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 md:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_314px]">
          <div className="grid min-w-0 gap-5">
            <section id="listings" className="scroll-mt-20">
              <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3.5">
                <h2 className="font-display text-[26px] font-extrabold uppercase tracking-[0.03em] text-text">
                  What {coach.displayName} sells
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                  Nothing is charged until they accept
                </span>
              </div>

              {coach.listings.length === 0 ? (
                <p className="notch border border-border bg-surface px-5 py-4 text-[13px] text-text-muted">
                  Nothing on sale yet. This coach has been approved but has not published a
                  listing.
                </p>
              ) : (
                <div className="grid gap-3">
                  {coach.listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      coachSlug={params.slug}
                      acceptingStudents={coach.acceptingStudents}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="notch bg-hero-fade border border-border bg-surface p-6">
              <p className="mb-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                {"// How they coach"}
              </p>
              <p className="max-w-[66ch] whitespace-pre-wrap text-[14.5px] text-text-body">
                {coach.bio}
              </p>

              <div className="mt-5 grid gap-px border border-line-1 bg-line-1 sm:grid-cols-3">
                <Fact label="Plays in" value={coach.regions.map(regionLabel).join(", ")} />
                <Fact label="Coaches in" value={coach.languages.map(languageLabel).join(", ")} />
                <Fact label="Their clock" value={coach.timezone} />
              </div>
            </section>

            {coach.reviews.length > 0 && (
              <section>
                <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3.5">
                  <h2 className="font-display text-[26px] font-extrabold uppercase tracking-[0.03em] text-text">
                    What students said
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                    {coach.ratingCount} {coach.ratingCount === 1 ? "review" : "reviews"} &middot;
                    only from paid sessions
                  </span>
                </div>
                <div className="grid gap-3">
                  {coach.reviews.map((review) => (
                    <CoachReviewCard
                      key={review.id}
                      review={review}
                      coachName={coach.displayName}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="grid gap-3.5 lg:sticky lg:top-20">
            <NextSlotCard
              coachSlug={params.slug}
              listingId={scheduledListing?.id ?? null}
              acceptingStudents={coach.acceptingStudents}
            />

            <HudPanel label="At a glance">
              <dl className="grid gap-2.5">
                <Glance
                  label="Verified rank"
                  value={
                    coach.badge
                      ? formatRank({
                          tier: coach.badge.tier,
                          division: coach.badge.division,
                          leaguePoints: coach.badge.leaguePoints,
                        })
                      : "Not checked"
                  }
                  className={coach.badge ? tierColorClass(coach.badge.tier) : "text-text-muted"}
                />
                <Glance label="Sessions completed" value={String(coach.sessionsCompleted)} />
                <Glance
                  label="Rating"
                  value={
                    coach.rating === null
                      ? "New coach"
                      : `${coach.rating.toFixed(1)} (${coach.ratingCount})`
                  }
                  className={coach.rating === null ? "text-text-muted" : "text-accent"}
                />
                <Glance
                  label="Taking students"
                  value={coach.acceptingStudents ? "Yes" : "Paused"}
                  className={coach.acceptingStudents ? "text-accent" : "text-warning"}
                />
                {cheapest !== null && (
                  <Glance
                    label="Cheapest listing"
                    value={formatMoney(cheapest, coach.listings[0].currency)}
                  />
                )}
              </dl>
            </HudPanel>

            <HudPanel label="How booking works">
              <BookingSteps />
              <p className="mt-3.5 border-t border-line-1 pt-3 font-mono text-[9.5px] uppercase tracking-[0.12em] text-text-faint">
                Keep it on LaneIQ — sessions arranged elsewhere are not covered
              </p>
            </HudPanel>
          </div>
        </div>
      </div>
    </>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={
        accent
          ? "tag-cut border border-accent bg-accent/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-accent"
          : "tag-cut border border-line-2 bg-surface-dark px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted"
      }
    >
      {children}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background px-4 py-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-1.5 text-[13.5px] text-text">{value}</p>
    </div>
  );
}

function Glance({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className={`text-right font-mono text-[12.5px] ${className ?? "text-text"}`}>{value}</dd>
    </div>
  );
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
