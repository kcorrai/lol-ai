import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCoachProfilePage } from "@/domains/marketplace";
import { ListingCard } from "@/domains/marketplace/components/ListingCard";
import { coachProfileJsonLd } from "@/domains/marketplace/jsonLd";
import { regionLabel } from "@/lib/riot/regions";
import { RankBadgeChip } from "@/domains/marketplace/components/RankBadgeChip";
import { languageLabel, roleLabel } from "@/domains/marketplace/components/options";

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

// The public profile. Listings, availability and the booking button arrive with
// M4–M7; what is here is what a student needs to decide whether to read on.
export default async function CoachProfilePage({ params }: Props) {
  const coach = await getCoachProfilePage(params.slug);
  if (!coach) notFound();

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg"}/coaches/${params.slug}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coachProfileJsonLd({ coach, url })) }}
      />

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold text-text">{coach.displayName}</h1>
        <p className="text-sm text-text-body">{coach.headline}</p>

        {coach.badge && <RankBadgeChip badge={coach.badge} detailed />}

        <div className="flex flex-wrap gap-1.5">
          {coach.roles.map((role) => (
            <Badge key={role} variant="secondary">
              {roleLabel(role)}
            </Badge>
          ))}
          {coach.regions.map((region) => (
            <Badge key={region} variant="outline">
              {regionLabel(region)}
            </Badge>
          ))}
          {coach.languages.map((lang) => (
            <Badge key={lang} variant="outline">
              {languageLabel(lang)}
            </Badge>
          ))}
        </div>
      </header>

      <dl className="flex flex-wrap gap-3">
        <Fact label="Sessions completed" value={String(coach.sessionsCompleted)} />
        <Fact
          label="Rating"
          value={coach.rating === null ? "New coach" : `${coach.rating.toFixed(1)} (${coach.ratingCount})`}
        />
        <Fact label="Taking students" value={coach.acceptingStudents ? "Yes" : "Paused"} />
      </dl>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-text">What {coach.displayName} sells</h2>

        {coach.listings.length === 0 ? (
          <p className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-text-muted">
            Nothing on sale yet. This coach has been approved but has not published a listing.
          </p>
        ) : (
          <div className="space-y-3">
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

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-text">How they coach</h2>
        <p className="whitespace-pre-wrap text-sm text-text-body">{coach.bio}</p>
      </section>

      {coach.reviews.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-text">What students said</h2>
          {coach.reviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-accent">{review.rating}/5</span>
                <span className="text-xs text-text-muted">{review.authorName}</span>
              </div>
              {review.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-body">{review.body}</p>
              )}
              {review.coachReply && (
                <p className="mt-3 border-l border-border pl-3 text-sm text-text-muted">
                  <span className="font-semibold text-text">{coach.displayName}:</span>{" "}
                  {review.coachReply}
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <dd className="font-mono text-lg text-text">{value}</dd>
      <dt className="text-xs text-text-muted">{label}</dt>
    </div>
  );
}
