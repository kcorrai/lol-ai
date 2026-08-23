import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getRequiredSession } from "@/lib/auth/session";
import {
  getOwnProfile,
  coachWorkload,
  ownCoachProfileId,
  coachConsoleStats,
  getBadge,
  getAvailability,
  listOwnListings,
  listBookings,
  getBookingFor,
} from "@/domains/marketplace";
import { Button } from "@/components/ui/button";
import { MarketPageHeader } from "@/domains/marketplace/components/hud/MarketPageHeader";
import { CoachPortrait } from "@/domains/marketplace/components/hud/CoachPortrait";
import { StatusChip } from "@/domains/marketplace/components/hud/StatusChip";
import { HudRule } from "@/domains/marketplace/components/hud/HudRule";
import { BookingList } from "@/domains/marketplace/components/BookingList";
import { AcceptingStudentsToggle } from "@/domains/marketplace/components/console/AcceptingStudentsToggle";
import { UrgentRequestPanel } from "@/domains/marketplace/components/console/UrgentRequestPanel";
import { PipelineStrip } from "@/domains/marketplace/components/console/PipelineStrip";
import { EarningsPanel } from "@/domains/marketplace/components/console/EarningsPanel";
import { ManageTiles } from "@/domains/marketplace/components/console/ManageTiles";
import { ConsoleRail } from "@/domains/marketplace/components/console/ConsoleRail";

export const metadata: Metadata = { title: "Coach Console" };

export const dynamic = "force-dynamic";

// The coach's home inside the section.
//
// Anyone without a profile is sent to the application rather than shown an
// empty console — "you are not a coach yet" is a different page, and it already
// exists.
export default async function CoachConsolePage() {
  const session = await getRequiredSession();
  const profile = await getOwnProfile(session.user.id);

  if (!profile) redirect("/coach/apply");

  const coachProfileId = await ownCoachProfileId(session.user.id);
  if (!coachProfileId) redirect("/coach/apply");

  const [workload, stats, badge, availability, listings, bookings] = await Promise.all([
    coachWorkload(coachProfileId),
    coachConsoleStats(coachProfileId),
    getBadge(coachProfileId),
    getAvailability(coachProfileId),
    listOwnListings(session.user.id),
    listBookings(session.user.id, "coach"),
  ]);

  const live = profile.status === "APPROVED";
  const requests = bookings.filter((b) => b.status === "PENDING_COACH");
  // The oldest one, because that is the one closest to expiring on its own.
  const oldest = requests[requests.length - 1] ?? null;
  const urgent = oldest ? await getBookingFor(oldest.id, session.user.id) : null;

  return (
    <>
      <MarketPageHeader
        title={profile.displayName || "Your coaching"}
        aside={<CoachPortrait name={profile.displayName} tier={badge?.tier} />}
        meta={
          <>
            <StatusChip tone={live && profile.acceptingStudents ? "good" : "warn"} pulse={live}>
              {live
                ? profile.acceptingStudents
                  ? "Live · students can book you"
                  : "Live · books closed"
                : profile.status === "PENDING"
                  ? "In review"
                  : "Not listed"}
            </StatusChip>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
              {listings.filter((l) => l.isActive).length} listings on sale &middot;{" "}
              {profile.timezone}
            </span>
          </>
        }
        actions={
          <>
            {profile.slug && (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/coaches/${profile.slug}`}>
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  View public profile
                </Link>
              </Button>
            )}
            <AcceptingStudentsToggle accepting={profile.acceptingStudents} disabled={!live} />
          </>
        }
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 md:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_314px]">
          <div className="grid min-w-0 gap-5">
            {urgent && (
              <UrgentRequestPanel
                request={urgent}
                goal={urgent.studentGoal}
                commissionBps={profile.commissionBps}
              />
            )}

            <section>
              <HudRule
                label="Pipeline"
                action={
                  <Link
                    href="/sessions"
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent hover:text-acid-400"
                  >
                    All sessions &rarr;
                  </Link>
                }
              />
              <PipelineStrip workload={workload} nextExpiry={oldest ? oldest.respondByAt : null} />
            </section>

            <EarningsPanel workload={workload} stats={stats} />

            <section>
              <HudRule label="Manage" />
              <ManageTiles
                live={live}
                activeListings={listings.filter((l) => l.isActive).length}
                openHoursPerWeek={openHoursPerWeek(availability.rules)}
                pending={workload.pending}
              />
            </section>

            <BookingList
              bookings={bookings}
              side="coach"
              label="Booked with me"
              empty={
                <>
                  <p className="font-display text-[15px] font-bold uppercase tracking-[0.04em] text-text">
                    Nobody has booked you yet
                  </p>
                  <p className="mt-2 text-[13px] text-text-muted">
                    A listing on sale and some open hours is what makes that possible.
                  </p>
                </>
              }
            />
          </div>

          <div className="lg:sticky lg:top-20">
            <ConsoleRail
              profile={profile}
              badge={badge}
              stats={stats}
              openHoursPerWeek={openHoursPerWeek(availability.rules)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/** Hours a coach is bookable in a normal week, before exceptions and bookings. */
function openHoursPerWeek(
  rules: { days: number[]; startMinute: number; endMinute: number }[]
): number {
  const minutes = rules.reduce(
    (sum, rule) => sum + (rule.endMinute - rule.startMinute) * rule.days.length,
    0
  );
  return Math.round(minutes / 60);
}
