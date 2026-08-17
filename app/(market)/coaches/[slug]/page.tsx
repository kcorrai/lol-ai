import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCoachBySlug } from "@/domains/marketplace";
import { regionLabel } from "@/lib/riot/regions";
import { RankBadgeChip } from "@/domains/marketplace/components/RankBadgeChip";
import { languageLabel, roleLabel } from "@/domains/marketplace/components/options";

export const revalidate = 300;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const coach = await getCoachBySlug(params.slug);
  if (!coach) return { title: "Coach not found" };

  return {
    title: `${coach.displayName} — League of Legends Coach`,
    description: coach.headline,
  };
}

// The public profile. Listings, availability and the booking button arrive with
// M4–M7; what is here is what a student needs to decide whether to read on.
export default async function CoachProfilePage({ params }: Props) {
  const coach = await getCoachBySlug(params.slug);
  if (!coach) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
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

      <p className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-text-muted">
        Booking opens once this coach has published what they sell and the hours they are available.
      </p>
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
