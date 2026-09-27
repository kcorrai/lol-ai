import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCoachProfilePage, isScheduled } from "@/domains/marketplace";
import { ListingCard } from "@/domains/marketplace/components/ListingCard";
import { coachProfileJsonLd } from "@/domains/marketplace/jsonLd";
import { regionLabel } from "@/lib/riot/regions";
import { languageLabel } from "@/domains/marketplace/components/options";
import { CoachReviewsSection } from "@/domains/marketplace/components/CoachReviewsSection";
import { IntroVideo } from "@/domains/marketplace/components/IntroVideo";
import { CoachProfileHero } from "@/domains/marketplace/components/CoachProfileHero";
import { CoachProfileRail } from "@/domains/marketplace/components/CoachProfileRail";
import { jsonLdProps } from "@/lib/security/jsonLd";

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
  // Trials are left out: they are an introduction, not the coach's rate.
  const cheapest = coach.listings
    .filter((l) => !l.isTrial)
    .reduce<
      number | null
    >((min, l) => (min === null || l.priceCents < min ? l.priceCents : min), null);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdProps(coachProfileJsonLd({ coach, url }))}
      />

      <CoachProfileHero coach={coach} />

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-8 md:px-8">
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid min-w-0 gap-9">
            <section id="listings" className="scroll-mt-20">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3.5">
                <h2 className="font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text md:text-[26px]">
                  What {coach.displayName} sells
                </h2>
                <span className="text-[12.5px] text-text-muted">
                  Nothing is charged until they accept
                </span>
              </div>

              {coach.listings.length === 0 ? (
                <p className="notch border border-border bg-surface px-5 py-4 text-[13px] text-text-muted">
                  Nothing on sale yet. This coach has been approved but has not published a listing.
                </p>
              ) : (
                <div className="grid gap-3.5">
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

            {coach.introVideoUrl && (
              <IntroVideo url={coach.introVideoUrl} coachName={coach.displayName} />
            )}

            <section className="notch bg-hero-fade border border-border bg-surface p-6 md:p-7">
              <h2 className="mb-4 font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text md:text-[26px]">
                How they coach
              </h2>
              <p className="max-w-[66ch] whitespace-pre-wrap text-[15px] leading-relaxed text-text-body">
                {coach.bio}
              </p>

              <div className="mt-5 grid gap-px border border-line-1 bg-line-1 sm:grid-cols-3">
                <Fact label="Plays in" value={coach.regions.map(regionLabel).join(", ")} />
                <Fact label="Coaches in" value={coach.languages.map(languageLabel).join(", ")} />
                <Fact label="Their clock" value={coach.timezone} />
              </div>
            </section>

            <CoachReviewsSection coach={coach} />
          </div>

          <CoachProfileRail
            coach={coach}
            coachSlug={params.slug}
            scheduledListingId={scheduledListing?.id ?? null}
            cheapest={cheapest}
          />
        </div>
      </div>
    </>
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
