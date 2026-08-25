"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/uiLocale";
import { tierColorClass } from "@/lib/riot/rankDisplay";
import { formatRank } from "@/domains/marketplace/rank";
import type { RankBadge } from "@/domains/marketplace/types";

interface Props {
  badge: RankBadge;
  /** Adds the peak and the check date. Off on dense search cards. */
  detailed?: boolean;
  className?: string;
}

/**
 * A coach's rank, and how much the claim is worth.
 *
 * The wording is deliberate and load-bearing. "Checked by LaneIQ" means we read
 * this from Riot for a linked account on that date — it does **not** mean the
 * account was proven to belong to this person, which needs Riot Sign-On and an
 * invitation we do not have. Every competitor displays a self-reported number
 * with no qualifier at all, so the honest version is still the strongest one on
 * the market; overstating it would throw away the only reason to believe it.
 */
export function RankBadgeChip({ badge, detailed, className }: Props): React.ReactElement {
  const verified = badge.method === "RIOT_VERIFIED";
  const checked = badge.method === "PLATFORM_CHECKED";
  const Icon = badge.stale ? ShieldAlert : ShieldCheck;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1",
        badge.stale ? "border-warning/30 bg-warning/10" : "border-border bg-surface-2",
        className
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", badge.stale ? "text-warning" : "text-accent")}
        aria-hidden
      />

      <span className={cn("font-mono text-xs font-semibold", tierColorClass(badge.tier))}>
        {formatRank({
          tier: badge.tier,
          division: badge.division,
          leaguePoints: badge.leaguePoints,
        })}
      </span>

      <span className="text-[10.5px] uppercase tracking-wide text-text-muted">
        {verified ? "Riot-verified" : checked ? "Checked by LaneIQ" : "Self-reported"}
      </span>

      {detailed && (
        <span className="text-[10.5px] text-text-faint">
          {badge.peakTier && (
            <>peak {formatRank({ tier: badge.peakTier, division: badge.peakDivision ?? "I" })} · </>
          )}
          {badge.stale ? "needs a refresh" : `checked ${formatDay(badge.checkedAt)}`}
        </span>
      )}
    </span>
  );
}

function formatDay(iso: string): string {
  return formatDate(iso, { day: "numeric", month: "short" });
}
