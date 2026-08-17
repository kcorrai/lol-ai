"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { OwnCoachProfile } from "@/domains/marketplace";

interface Props {
  profile: OwnCoachProfile;
  submitting: boolean;
  withdrawing: boolean;
  onSubmit: () => void;
  onWithdraw: () => void;
  error: string | null;
}

/**
 * Where an application stands, and the one action available from here.
 *
 * Every state says what happens next, including the ones that are bad news. A
 * rejected applicant is shown the reviewer's note, because being told nothing
 * is the complaint every rejected coach on every competing platform has — and
 * because a second application is only worth reading if the first was answered.
 */
export function ApplicationStatusPanel({
  profile,
  submitting,
  withdrawing,
  onSubmit,
  onWithdraw,
  error,
}: Props): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Application</CardTitle>
          <StatusBadge status={profile.status} />
        </div>
        <CardDescription>{describe(profile)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.status === "REJECTED" && profile.reviewNote && (
          <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-danger">
              Why it was declined
            </p>
            <p className="mt-1 text-sm text-text-body">{profile.reviewNote}</p>
          </div>
        )}

        {profile.status === "SUSPENDED" && profile.reviewNote && (
          <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-warning">
              Why it was suspended
            </p>
            <p className="mt-1 text-sm text-text-body">{profile.reviewNote}</p>
          </div>
        )}

        {error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {(profile.status === "DRAFT" || profile.status === "REJECTED") && (
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit for review"}
            </Button>
          )}

          {profile.status === "PENDING" && (
            <Button variant="outline" onClick={onWithdraw} disabled={withdrawing}>
              {withdrawing ? "Withdrawing…" : "Withdraw and keep editing"}
            </Button>
          )}

          {profile.status === "APPROVED" && profile.slug && (
            <Button asChild variant="secondary">
              <Link href={`/coaches/${profile.slug}`}>View your public profile</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: OwnCoachProfile["status"] }): React.ReactElement {
  switch (status) {
    case "APPROVED":
      return <Badge variant="success">Live</Badge>;
    case "PENDING":
      return <Badge variant="warning">In review</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Declined</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

function describe(profile: OwnCoachProfile): string {
  switch (profile.status) {
    case "APPROVED":
      return "You are listed. Students can find and book you.";
    case "PENDING":
      return "Submitted. Your profile is locked while somebody reads it — withdraw to keep editing.";
    case "REJECTED":
      return "Not accepted this time. Edit your profile and submit it again.";
    case "SUSPENDED":
      return "Your profile has been taken down. Bookings already made still run their course.";
    default:
      return "Not submitted yet. Fill this in, then send it for review.";
  }
}
