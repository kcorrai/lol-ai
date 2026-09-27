import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tierColorClass } from "@/lib/riot/rankDisplay";
import { formatRank } from "@/domains/marketplace/rank";
import { formatMoney } from "@/domains/marketplace/money";
import type { CoachPublicProfile } from "@/domains/marketplace/types";
import { Button } from "@/components/ui/button";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { BookingSteps } from "@/domains/marketplace/components/BookingSteps";
import { AskCoachButton } from "@/domains/marketplace/components/AskCoachButton";
import { NextSlotCard } from "@/domains/marketplace/components/NextSlotCard";

interface Props {
  coach: CoachPublicProfile;
  coachSlug: string;
  scheduledListingId: string | null;
  cheapest: number | null;
}

/**
 * The profile's sticky right-hand rail: what it costs, when they are free, and
 * what happens after pressing the button — the three questions that decide a
 * booking, kept in view the whole way down the page.
 */
export function CoachProfileRail({
  coach,
  coachSlug,
  scheduledListingId,
  cheapest,
}: Props): React.ReactElement {
  return (
    <div className="grid gap-3.5 lg:sticky lg:top-20">
      <section className="notch bg-hero-fade border border-border bg-surface p-5">
        {cheapest !== null ? (
          <p className="flex items-baseline gap-2">
            <span className="text-[12.5px] text-text-muted">from</span>
            <span className="font-mono text-[32px] font-bold leading-none text-text">
              {formatMoney(cheapest, coach.listings[0].currency)}
            </span>
          </p>
        ) : (
          <p className="text-[13.5px] text-text-muted">No listing published yet</p>
        )}
        <p
          className={cn(
            "mt-2.5 flex items-center gap-2 text-[12.5px]",
            coach.acceptingStudents ? "text-text-body" : "text-warning"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              coach.acceptingStudents ? "animate-pulse bg-accent" : "bg-warning"
            )}
            aria-hidden
          />
          {coach.acceptingStudents ? "Taking students" : "Paused — not taking students"}
        </p>
        {coach.acceptingStudents && coach.listings.length > 0 && (
          <Button asChild className="mt-4 w-full">
            <a href="#listings">
              See what they sell
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        )}
        <div className="mt-2.5">
          <AskCoachButton coachSlug={coachSlug} coachName={coach.displayName} />
        </div>
        <p className="mt-3 text-center text-[11.5px] text-text-faint">
          Nothing is charged until they accept
        </p>
      </section>

      <NextSlotCard
        coachSlug={coachSlug}
        listingId={scheduledListingId}
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
          <Glance label="Their clock" value={coach.timezone} />
        </dl>
      </HudPanel>

      <HudPanel label="How booking works">
        <BookingSteps />
        <p className="mt-3.5 border-t border-line-1 pt-3 text-[11.5px] text-text-faint">
          Keep it on LaneIQ — sessions arranged elsewhere are not covered.
        </p>
      </HudPanel>
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
}): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className={cn("text-right font-mono text-[12.5px]", className ?? "text-text")}>
        {value}
      </dd>
    </div>
  );
}
