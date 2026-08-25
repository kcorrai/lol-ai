import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/uiLocale";
import { regionLabel } from "@/lib/riot/regions";
import { tierColorClass } from "@/lib/riot/rankDisplay";
import { formatRank } from "@/domains/marketplace/rank";
import { formatMoney } from "@/domains/marketplace/money";
import type { CoachCard } from "@/domains/marketplace/types";
import { CoachPortrait } from "@/domains/marketplace/components/hud/CoachPortrait";
import { languageLabel, roleLabel } from "@/domains/marketplace/components/options";

interface Props {
  coach: CoachCard;
  /** The first card on an unfiltered storefront, lit rather than merely listed. */
  featured?: boolean;
}

/**
 * One coach on the storefront.
 *
 * The checked rank gets its own inset strip in the middle of the card, above
 * the tags and below the name. That placement is the argument: every competitor
 * shows a rank somebody typed into a bio, and the whole reason to book here is
 * that this one was read from Riot on a date we print.
 */
export function CoachCardTile({ coach, featured }: Props): React.ReactElement {
  return (
    <Link
      href={`/coaches/${coach.slug}`}
      className={cn(
        "notch group relative block overflow-hidden p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-surface-2",
        featured
          ? "bg-hero-fade glow-accent-soft border border-accent/40 bg-surface"
          : "border border-border bg-surface",
        !coach.acceptingStudents && "opacity-75"
      )}
    >
      <span className="flex items-start gap-3">
        <CoachPortrait name={coach.displayName} tier={coach.badge?.tier} size="sm" />

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[16.5px] font-extrabold uppercase leading-tight tracking-[0.03em] text-text">
              {coach.displayName}
            </span>
            {coach.fromPriceCents !== null && (
              <span className="shrink-0 text-right">
                <span className="block font-mono text-[19px] font-bold leading-none text-text">
                  {formatMoney(coach.fromPriceCents, coach.currency)}
                </span>
                <span className="mt-1 block font-mono text-[8.5px] uppercase tracking-[0.18em] text-text-faint">
                  from
                </span>
              </span>
            )}
          </span>
          <span className="mt-1.5 line-clamp-2 block text-[13.5px] text-text-muted">
            {coach.headline}
          </span>
        </span>
      </span>

      {coach.badge ? (
        <span
          className={cn(
            "tag-cut mt-3 flex items-center gap-2.5 border bg-surface-dark px-2.5 py-2",
            coach.badge.stale ? "border-warning/30" : "border-accent/30"
          )}
        >
          {coach.badge.stale ? (
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
          )}
          <span
            className={cn(
              "font-mono text-[13px] font-bold tracking-[0.06em]",
              tierColorClass(coach.badge.tier)
            )}
          >
            {formatRank({
              tier: coach.badge.tier,
              division: coach.badge.division,
              leaguePoints: coach.badge.leaguePoints,
            })}
          </span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-faint">
            {coach.badge.stale ? "needs a refresh" : `checked ${day(coach.badge.checkedAt)}`}
          </span>
        </span>
      ) : (
        <span className="tag-cut mt-3 flex items-center gap-2.5 border border-line-2 bg-surface-dark px-2.5 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-faint">
            No rank checked yet
          </span>
        </span>
      )}

      <span className="mt-3 flex flex-wrap gap-1.5">
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
      </span>

      <span className="mt-3 flex items-center gap-3 border-t border-line-1 pt-3">
        {/* Withheld below three reviews. One five-star review is not a rating,
            and showing it as one is how a marketplace's numbers stop meaning
            anything. */}
        {coach.rating === null ? (
          <span className="tag-cut mr-auto border border-warning px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-warning">
            New coach
          </span>
        ) : (
          <span className="flex flex-1 items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-accent">
              {coach.rating.toFixed(1)}
            </span>
            <span className="h-[3px] max-w-[74px] flex-1 bg-surface-dark">
              <span
                className="block h-full bg-accent"
                style={{ width: `${(coach.rating / 5) * 100}%` }}
              />
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em] text-text-faint">
              ({coach.ratingCount})
            </span>
          </span>
        )}

        <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
          {coach.sessionsCompleted} {coach.sessionsCompleted === 1 ? "session" : "sessions"}
        </span>
      </span>

      <span className="mt-3 flex items-center justify-between gap-2.5 border-t border-line-1 pt-3">
        <span
          className={cn(
            "flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em]",
            !coach.acceptingStudents
              ? "text-danger"
              : coach.sessionsCompleted === 0
                ? "text-warning"
                : "text-text-muted"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0",
              !coach.acceptingStudents
                ? "bg-danger"
                : coach.sessionsCompleted === 0
                  ? "bg-warning"
                  : "animate-pulse bg-accent"
            )}
            aria-hidden
          />
          {!coach.acceptingStudents
            ? "Not taking students"
            : coach.sessionsCompleted === 0
              ? "New · no sessions yet"
              : "Taking students"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
          View &rarr;
        </span>
      </span>
    </Link>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        "tag-cut border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
        accent
          ? "border-accent bg-accent/10 text-accent"
          : "border-line-2 bg-surface-dark text-text-muted"
      )}
    >
      {children}
    </span>
  );
}

function day(iso: string): string {
  return formatDate(iso, { day: "numeric", month: "short" });
}
