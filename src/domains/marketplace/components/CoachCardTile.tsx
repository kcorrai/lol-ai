import Link from "next/link";
import { ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/uiLocale";
import { regionLabel } from "@/lib/riot/regions";
import { tierColorClass } from "@/lib/riot/rankDisplay";
import { formatRank } from "@/domains/marketplace/rank";
import { formatMoney } from "@/domains/marketplace/money";
import type { CoachCard } from "@/domains/marketplace/types";
import { CoachPortrait } from "@/domains/marketplace/components/hud/CoachPortrait";
import { RankCrest } from "@/domains/marketplace/components/hud/RankCrest";
import { RoleIcon } from "@/domains/marketplace/components/hud/RoleIcon";
import { StarRating } from "@/domains/marketplace/components/hud/StarRating";
import { tierTint } from "@/domains/marketplace/components/hud/tierTone";
import { languageLabel } from "@/domains/marketplace/components/options";

interface Props {
  coach: CoachCard;
  /** The first card on an unfiltered storefront, lit rather than merely listed. */
  featured?: boolean;
}

/**
 * One coach on the storefront.
 *
 * The checked rank is the picture: the crest sits top-right in a glow of its
 * own tier colour, and the line under the name says when we read it. That is
 * the argument — every competitor shows a rank somebody typed into a bio, and
 * the whole reason to book here is that this one was read from Riot on a date
 * we print.
 */
export function CoachCardTile({ coach, featured }: Props): React.ReactElement {
  const tier = coach.badge?.tier ?? null;

  return (
    <Link
      href={`/coaches/${coach.slug}`}
      className={cn(
        "notch group relative flex h-full flex-col overflow-hidden border bg-surface transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-accent/60 hover:bg-surface-2",
        featured ? "glow-accent-soft border-accent/40" : "border-border",
        !coach.acceptingStudents && "opacity-75"
      )}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background: `radial-gradient(260px 150px at 88% 0%, ${tierTint(tier, 0.2)}, transparent 75%)`,
        }}
        aria-hidden
      />

      <span className="relative flex items-start gap-3 p-5 pb-0">
        <CoachPortrait name={coach.displayName} tier={tier} size="md" />
        <span className="min-w-0 flex-1 pt-0.5">
          {featured && (
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
              Top rated
            </span>
          )}
          <span className="line-clamp-2 block break-words font-display text-[14px] font-extrabold uppercase leading-tight tracking-[0.03em] text-text sm:text-[15.5px]">
            {coach.displayName}
          </span>
          <RankLine coach={coach} />
        </span>
        <RankCrest tier={tier} size="md" dimmed={coach.badge?.stale} className="-mr-1 -mt-1" />
      </span>

      <span className="relative mt-3.5 line-clamp-2 block px-5 text-[13.5px] leading-relaxed text-text-body">
        {coach.headline}
      </span>

      <span className="relative mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 text-[12.5px] text-text">
        {coach.roles.map((role) => (
          <RoleIcon key={role} role={role} labelled size={15} />
        ))}
        <span className="text-text-muted">
          {[...coach.regions.map(regionLabel), ...coach.languages.map(languageLabel)].join(" · ")}
        </span>
      </span>

      <span className="relative mb-5 mt-4 flex items-center gap-3 px-5">
        {/* Withheld below three reviews. One five-star review is not a rating,
            and showing it as one is how a marketplace's numbers stop meaning
            anything. */}
        {coach.rating === null ? (
          <span className="tag-cut border border-warning/60 bg-warning/10 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-warning">
            New coach
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <StarRating value={coach.rating} size={13} />
            <span className="font-mono text-[13px] font-bold text-text">
              {coach.rating.toFixed(1)}
            </span>
            <span className="text-[12px] text-text-muted">({coach.ratingCount})</span>
          </span>
        )}
        <span className="ml-auto text-[12px] text-text-muted">
          <span className="font-mono text-text">{coach.sessionsCompleted}</span>{" "}
          {coach.sessionsCompleted === 1 ? "session" : "sessions"}
        </span>
      </span>

      <span className="relative mt-auto flex items-center gap-3 border-t border-line-1 px-5 py-3.5">
        <Availability coach={coach} />
        {coach.fromPriceCents !== null && (
          <span className="ml-auto text-right">
            <span className="mr-1.5 text-[11px] text-text-muted">from</span>
            <span className="font-mono text-[18px] font-bold text-text">
              {formatMoney(coach.fromPriceCents, coach.currency)}
            </span>
          </span>
        )}
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center border border-line-2 text-text-muted transition-colors",
            "group-hover:border-accent group-hover:bg-accent group-hover:text-background",
            coach.fromPriceCents === null && "ml-auto"
          )}
          aria-hidden
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </span>
    </Link>
  );
}

function RankLine({ coach }: { coach: CoachCard }): React.ReactElement {
  const badge = coach.badge;
  if (!badge) {
    return <span className="mt-1.5 block text-[12px] text-text-faint">No rank checked yet</span>;
  }

  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {badge.stale ? (
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
      )}
      <span className={cn("font-mono text-[13px] font-bold", tierColorClass(badge.tier))}>
        {formatRank({
          tier: badge.tier,
          division: badge.division,
          leaguePoints: badge.leaguePoints,
        })}
      </span>
      <span className={cn("text-[11px]", badge.stale ? "text-warning" : "text-text-faint")}>
        {badge.stale ? "needs a refresh" : `checked ${day(badge.checkedAt)}`}
      </span>
    </span>
  );
}

function Availability({ coach }: { coach: CoachCard }): React.ReactElement {
  const [tone, dot, label] = !coach.acceptingStudents
    ? ["text-danger", "bg-danger", "Not taking students"]
    : coach.sessionsCompleted === 0
      ? ["text-warning", "bg-warning", "New · no sessions yet"]
      : ["text-text-body", "animate-pulse bg-accent", "Taking students"];

  return (
    <span className={cn("flex items-center gap-2 text-[12px]", tone)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}

function day(iso: string): string {
  return formatDate(iso, { day: "numeric", month: "short" });
}
