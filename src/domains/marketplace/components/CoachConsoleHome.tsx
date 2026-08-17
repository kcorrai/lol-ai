"use client";

import Link from "next/link";
import { CalendarClock, ClipboardList, Tags, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CoachWorkload, OwnCoachProfile } from "@/domains/marketplace";

interface Props {
  profile: OwnCoachProfile;
  /** Null only while a profile exists but its id could not be read. */
  workload: CoachWorkload | null;
}

/**
 * The console's landing grid.
 *
 * Every tile that is not built yet says so rather than being hidden — a coach
 * needs to know what this will become before deciding to invest a profile in
 * it, and a console that quietly grows tiles reads as broken until it does not.
 */
export function CoachConsoleHome({ profile, workload }: Props): React.ReactElement {
  const live = profile.status === "APPROVED";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Status</CardTitle>
            <Badge variant={live ? "success" : profile.status === "PENDING" ? "warning" : "outline"}>
              {live ? "Live" : profile.status === "PENDING" ? "In review" : "Not listed"}
            </Badge>
          </div>
          <CardDescription>
            {live
              ? "Students can find and book you."
              : "You are not listed yet — finish your application to appear on the storefront."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Stat label="Sessions completed" value={String(profile.sessionsCompleted)} />
          <Stat label="Reviews" value={String(profile.ratingCount)} />
          <Stat label="Taking students" value={profile.acceptingStudents ? "Yes" : "Paused"} />
        </CardContent>
      </Card>

      {workload && (
        <Card>
          <CardHeader>
            <CardTitle>Right now</CardTitle>
            <CardDescription>
              {workload.pending > 0
                ? `${workload.pending} ${workload.pending === 1 ? "person is" : "people are"} waiting on an answer from you.`
                : "Nothing is waiting on you."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <Stat label="Awaiting your answer" value={String(workload.pending)} />
            <Stat label="Upcoming" value={String(workload.upcoming)} />
            <Stat label="Delivered, unconfirmed" value={String(workload.awaitingConfirmation)} />
            <Stat label="Earned" value={money(workload.releasedCents, workload.currency)} />
            <Stat label="Held" value={money(workload.heldCents, workload.currency)} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Tile
          href="/coach/profile"
          icon={UserRound}
          title="Profile and rank"
          description="What students read, and the account your rank is checked against."
        />
        <Tile
          href="/coach/listings"
          icon={Tags}
          title="Listings"
          description="What you sell, how long it takes, and what it costs."
        />
        <Tile
          href="/coach/availability"
          icon={CalendarClock}
          title="Availability"
          description="The hours you are bookable, in your own timezone."
        />
        <Tile
          href="/sessions"
          icon={ClipboardList}
          title="Requests and sessions"
          description="Accept or decline bookings, and deliver the work."
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
      <p className="font-mono text-lg text-text">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function Tile({
  href,
  icon: Icon,
  title,
  description,
  soon,
}: {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  soon?: boolean;
}): React.ReactElement {
  const body = (
    <div className="flex h-full items-start gap-3 rounded-lg border border-border bg-surface p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-text">
          {title}
          {soon && (
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-faint">
              Soon
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-text-muted">{description}</p>
      </div>
    </div>
  );

  if (!href) return <div className="opacity-60">{body}</div>;

  return (
    <Link href={href} className="transition-opacity hover:opacity-90">
      {body}
    </Link>
  );
}

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
