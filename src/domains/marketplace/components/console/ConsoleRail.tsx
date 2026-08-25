import Link from "next/link";
import { formatDate } from "@/lib/uiLocale";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { MeterRow } from "@/domains/marketplace/components/hud/MeterRow";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";
import { RankBadgeChip } from "@/domains/marketplace/components/RankBadgeChip";
import { formatMoney } from "@/domains/marketplace/money";
import { COACH_RESPONSE_HOURS } from "@/domains/marketplace/policy";
import type { CoachConsoleStats } from "@/domains/marketplace/services/coachStatsService";
import type { OwnCoachProfile } from "@/domains/marketplace/services/coachProfileService";
import type { RankBadge } from "@/domains/marketplace/types";

interface Props {
  profile: OwnCoachProfile;
  badge: RankBadge | null;
  stats: CoachConsoleStats;
  openHoursPerWeek: number;
}

/**
 * The console's right-hand column: who the storefront says you are.
 *
 * Everything in it is measured rather than declared — a rank read from Riot, a
 * response time counted off the events, a rating a coach cannot touch. That is
 * the whole pitch of this marketplace, so it is the part that gets the rail.
 */
export function ConsoleRail({
  profile,
  badge,
  stats,
  openHoursPerWeek,
}: Props): React.ReactElement {
  const thisWeek = stats.weeks[stats.weeks.length - 1];

  return (
    <div className="grid gap-3.5">
      <HudPanel label="Your rank" tone="accent">
        {badge ? (
          <RankBadgeChip badge={badge} detailed />
        ) : (
          <p className="font-mono text-sm text-text-muted">No rank checked yet.</p>
        )}
        <p className="mt-3 text-[13px] text-text-body">
          Read from your linked Riot account and refreshed for you. Students see the date it was
          last checked — you never type a rank in.
        </p>
        <p className="mt-3.5 flex items-center justify-between gap-3 border-t border-line-1 pt-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          <span>{badge ? `Checked ${day(badge.checkedAt)}` : "Never checked"}</span>
          <Link href="/coach/profile" className="text-accent hover:text-acid-400">
            {badge ? "Refresh" : "Check it"} &rarr;
          </Link>
        </p>
      </HudPanel>

      <HudPanel label="How you are doing">
        <div className="grid gap-3">
          <MeterRow
            label="Answer time"
            value={
              stats.medianAnswerHours === null
                ? "no answers yet"
                : `${round(stats.medianAnswerHours)}h median`
            }
            // Against the window a request actually has, so the bar means
            // something rather than being scored out of an invented target.
            percent={
              stats.medianAnswerHours === null
                ? 0
                : 100 - (stats.medianAnswerHours / COACH_RESPONSE_HOURS) * 100
            }
            compact
          />
          <MeterRow
            label="Accept rate"
            value={
              stats.acceptRate === null
                ? "no requests yet"
                : `${Math.round(stats.acceptRate * 100)}%`
            }
            percent={(stats.acceptRate ?? 0) * 100}
            compact
          />
          <MeterRow
            label="Rating"
            value={
              profile.rating === null ? `${profile.ratingCount} reviews` : profile.rating.toFixed(1)
            }
            percent={((profile.rating ?? 0) / 5) * 100}
            compact
          />
          <MeterRow
            label="Open disputes"
            value={String(stats.openDisputes)}
            percent={stats.openDisputes === 0 ? 3 : 100}
            tone={stats.openDisputes === 0 ? "muted" : "info"}
            compact
          />
        </div>
        <p className="mt-3.5 border-t border-line-1 pt-3 text-[12.5px] text-text-muted">
          A request you never answer expires by itself after {COACH_RESPONSE_HOURS} hours, and the
          student gets their money back.
        </p>
      </HudPanel>

      <HudPanel label="This week">
        <div className="grid grid-cols-2 gap-4">
          <MarketStat label="Sessions" value={String(thisWeek.sessions)} />
          <MarketStat
            label="Earned"
            value={formatMoney(thisWeek.earnedCents, stats.currency)}
            tone="accent"
          />
          <MarketStat label="Hours open" value={String(openHoursPerWeek)} unit="/ week" />
          <MarketStat label="Reviews" value={String(profile.ratingCount)} />
        </div>
      </HudPanel>
    </div>
  );
}

function day(iso: string): string {
  return formatDate(iso, { day: "numeric", month: "short" });
}

function round(hours: number): string {
  return hours < 1 ? "<1" : String(Math.round(hours));
}
