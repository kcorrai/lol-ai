import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/uiLocale";
import { regionLabel } from "@/lib/riot/regions";
import { tierColorClass } from "@/lib/riot/rankDisplay";
import { formatPeak, formatRank } from "@/domains/marketplace/rank";
import type { CoachPublicProfile } from "@/domains/marketplace/types";
import { RankCrest } from "@/domains/marketplace/components/hud/RankCrest";
import { RoleIcon } from "@/domains/marketplace/components/hud/RoleIcon";
import { StarRating } from "@/domains/marketplace/components/hud/StarRating";
import { tierTint } from "@/domains/marketplace/components/hud/tierTone";
import { languageLabel } from "@/domains/marketplace/components/options";

interface Props {
  coach: CoachPublicProfile;
}

/**
 * The top of a public coach profile.
 *
 * The crest is drawn at full size beside the name and the whole band is lit in
 * its tier colour, because the verified rank is the one claim on the page
 * nobody typed in — it should be what a student sees before anything else.
 */
export function CoachProfileHero({ coach }: Props): React.ReactElement {
  const tier = coach.badge?.tier ?? null;

  return (
    <section className="relative overflow-hidden border-b border-line-1">
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(720px 420px at 10% 30%, ${tierTint(tier, 0.16)}, transparent 70%), var(--bg-hero-fade)`,
        }}
        aria-hidden
      />
      <span className="bg-scanline absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-[1240px] px-5 pb-8 pt-7 md:px-8">
        <nav className="text-[12px] text-text-faint" aria-label="Breadcrumb">
          <Link href="/coaches" className="text-text-muted hover:text-accent">
            Coaching
          </Link>{" "}
          /{" "}
          <Link href="/coaches" className="text-text-muted hover:text-accent">
            Coaches
          </Link>{" "}
          / <span className="text-text-body">{coach.displayName}</span>
        </nav>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <RankCrest
            tier={tier}
            size="xl"
            dimmed={coach.badge?.stale}
            className="self-start sm:self-center"
          />

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[32px] font-black uppercase leading-[0.98] tracking-[0.02em] text-text md:text-[44px]">
              {coach.displayName}
            </h1>
            <p className="mt-3 max-w-[60ch] text-[15.5px] leading-relaxed text-text-body">
              {coach.headline}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-text">
              {coach.roles.map((role) => (
                <RoleIcon key={role} role={role} labelled size={18} />
              ))}
              <span className="text-text-muted">
                {[...coach.regions.map(regionLabel), ...coach.languages.map(languageLabel)].join(
                  " · "
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-px border border-line-1 bg-line-1 md:grid-cols-[1.6fr_1fr_1fr]">
          <VerifiedRank coach={coach} />
          <div className="bg-surface-dark/90 px-5 py-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-text-muted">
              Rating
            </p>
            {coach.rating === null ? (
              <p className="mt-2 text-[15px] text-text">
                New coach
                <span className="mt-1 block text-[12px] text-text-muted">
                  Shown after three reviews
                </span>
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-2.5">
                <span className="font-mono text-[26px] font-bold leading-none text-accent">
                  {coach.rating.toFixed(1)}
                </span>
                <span>
                  <StarRating value={coach.rating} size={13} />
                  <span className="block text-[12px] text-text-muted">
                    {coach.ratingCount} {coach.ratingCount === 1 ? "review" : "reviews"}
                  </span>
                </span>
              </p>
            )}
          </div>
          <div className="bg-surface-dark/90 px-5 py-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-text-muted">
              Sessions
            </p>
            <p className="mt-2 font-mono text-[26px] font-bold leading-none text-text">
              {coach.sessionsCompleted}
            </p>
            <p className="mt-1 text-[12px] text-text-muted">completed on LaneIQ</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function VerifiedRank({ coach }: Props): React.ReactElement {
  const badge = coach.badge;

  if (!badge) {
    return (
      <div className="bg-surface-dark/90 px-5 py-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-text-muted">
          Verified rank
        </p>
        <p className="mt-2 text-[14px] text-text-muted">No rank checked for this coach yet</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-dark/90 px-5 py-4">
      <p
        className={cn(
          "flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em]",
          badge.stale ? "text-warning" : "text-accent"
        )}
      >
        {badge.stale ? (
          <ShieldAlert className="h-4 w-4" aria-hidden />
        ) : (
          <ShieldCheck className="h-4 w-4" aria-hidden />
        )}
        Checked by LaneIQ
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-[24px] font-bold leading-none",
          tierColorClass(badge.tier)
        )}
      >
        {formatRank({
          tier: badge.tier,
          division: badge.division,
          leaguePoints: badge.leaguePoints,
        })}
      </p>
      <p className="mt-1.5 text-[12px] text-text-muted">
        {badge.peakTier && `Peak ${formatPeak(badge.peakTier, badge.peakDivision)} · `}
        read from a linked Riot account ·{" "}
        {badge.stale ? (
          <span className="text-warning">needs a refresh</span>
        ) : (
          `checked ${formatDate(badge.checkedAt, { day: "numeric", month: "short" })}`
        )}
      </p>
    </div>
  );
}
