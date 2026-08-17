"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { regionLabel } from "@/lib/riot/regions";
import type { CoachCard } from "@/domains/marketplace/types";
import { RankBadgeChip } from "@/domains/marketplace/components/RankBadgeChip";
import { languageLabel, roleLabel } from "@/domains/marketplace/components/options";

interface Props {
  coach: CoachCard;
}

/** One coach on the storefront. */
export function CoachCardTile({ coach }: Props): React.ReactElement {
  return (
    <Link
      href={`/coaches/${coach.slug}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-text">
            {coach.displayName}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{coach.headline}</p>
        </div>

        {coach.fromPriceCents !== null && (
          <p className="shrink-0 text-right font-mono text-sm text-text">
            {formatPrice(coach.fromPriceCents, coach.currency)}
            <span className="block text-[10px] uppercase tracking-wide text-text-faint">from</span>
          </p>
        )}
      </div>

      {coach.badge && <RankBadgeChip badge={coach.badge} />}

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

      <div className="mt-auto flex items-center gap-3 text-xs text-text-muted">
        {/* Withheld below three reviews. One five-star review is not a rating,
            and showing it as one is how a marketplace's numbers stop meaning
            anything. */}
        {coach.rating === null ? (
          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-faint">
            New coach
          </span>
        ) : (
          <span className="font-mono text-text">
            {coach.rating.toFixed(1)}
            <span className="ml-1 text-text-faint">({coach.ratingCount})</span>
          </span>
        )}

        <span>{coach.sessionsCompleted} sessions</span>

        {!coach.acceptingStudents && <span className="text-warning">Not taking students</span>}
      </div>
    </Link>
  );
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
