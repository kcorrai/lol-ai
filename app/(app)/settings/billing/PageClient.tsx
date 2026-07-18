"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreateCheckout } from "@/hooks/useCreateCheckout";
import { useCreateTeamCheckout } from "@/hooks/useCreateTeamCheckout";
import { useTeamSeats } from "@/hooks/useTeamSeats";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { CancelRetentionModal } from "@/domains/billing/components/CancelRetentionModal";

const FREE_FEATURES = [
  "3 AI coaching reports per month",
  "1 Riot account",
  "Last 10 matches",
  "Match detail analysis",
  "Ranked progress tracking",
];

const PRO_FEATURES = [
  "Unlimited AI coaching reports",
  "Up to 3 Riot accounts",
  "Last 100 matches",
  "Match detail analysis",
  "Ranked progress tracking",
  "Champion pool analysis",
  "Weekly improvement emails",
  "Priority AI processing",
];

const TEAM_FEATURES = [
  "All Pro features",
  "Create up to 5 teams",
  "5-member team (full roster)",
  "Team performance dashboard",
  "Coach and player roles",
  "Team invite via email",
  "Bulk member analysis",
];

const LS_PORTAL_URL = "https://app.lemonsqueezy.com/my-orders";

function BillingPageContent() {
  const { data: sub, isLoading } = useSubscription();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") === "annual" ? "annual" : "monthly";
  const checkout = useCreateCheckout(period);
  const teamCheckout = useCreateTeamCheckout();
  const [showRetentionModal, setShowRetentionModal] = useState(false);

  const isPro = sub?.plan === "pro" || sub?.plan === "elite" || sub?.plan === "team";
  const isTeam = sub?.plan === "team";
  const isUpgraded = isPro || isTeam;

  const { data: seats } = useTeamSeats();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <PageHeader title="Billing" subtitle="Manage your subscription and plan." />
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <PageHeader title="Billing" subtitle="Manage your subscription and plan." />

      <div className="space-y-4">
        {/* Current plan card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl font-bold text-text">
                {isTeam ? "Team" : isPro ? "Pro" : "Free"}
              </span>
              <Badge variant={isUpgraded ? "success" : "secondary"}>
                {sub?.status === "trialing"
                  ? "Trialing"
                  : isUpgraded
                    ? "Active"
                    : "Free"}
              </Badge>
              {sub?.cancelAtPeriodEnd && (
                <Badge variant="warning">Canceling at period end</Badge>
              )}
            </div>

            <ul className="space-y-1.5">
              {(isTeam ? TEAM_FEATURES : isPro ? PRO_FEATURES : FREE_FEATURES).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                  <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>

            {sub?.currentPeriodEnd && isUpgraded && (
              <p className="text-xs text-text-muted">
                {sub.cancelAtPeriodEnd ? "Access ending:" : "Renewing:"}{" "}
                {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Team seat indicator — shown for team plan users */}
        {isTeam && seats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {seats.teamsCount === 0 ? (
                <p className="text-sm text-text-muted">
                  You haven&apos;t created a team yet.{" "}
                  <Link href="/teams/create" className="text-accent underline underline-offset-2 hover:opacity-80">
                    Create team →
                  </Link>
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-warning" />
                    <span className="text-2xl font-bold text-text">
                      {seats.totalMembers}
                      <span className="text-base font-normal text-text-muted">/{seats.maxMembers}</span>
                    </span>
                    {seats.maxMembers > 0 && seats.totalMembers >= seats.maxMembers && (
                      <Badge variant="warning">Team full</Badge>
                    )}
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-warning transition-all"
                      style={{ width: `${seats.maxMembers > 0 ? Math.min((seats.totalMembers / seats.maxMembers) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    {seats.maxMembers - seats.totalMembers} empty slots · {seats.teamsCount} teams
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pro upgrade card — shown when free */}
        {!isUpgraded && (
          <Card className="border-accent/40 bg-accent/5">
            <CardHeader className="pb-2">
              <div className="flex items-baseline gap-2">
                <CardTitle className="text-xs font-medium uppercase tracking-widest text-accent">
                  Upgrade to Pro
                </CardTitle>
                <span className="font-display text-2xl font-bold text-text">$9.99</span>
                <span className="text-xs text-text-muted">/ month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => checkout.mutate()}
                disabled={checkout.isPending}
                className="w-full"
              >
                {checkout.isPending ? "Redirecting to checkout…" : "Upgrade to Pro — $9.99/month"}
              </Button>

              {checkout.isError && (
                <p className="text-xs text-danger">{checkout.error.message}</p>
              )}

              <p className="text-center text-xs text-text-muted">
                Secure payment with LemonSqueezy · Cancel anytime
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team Plan upgrade card — shown when free or pro (not already on team) */}
        {!isTeam && (
          <Card className="border-warning/40 bg-warning/5">
            <CardHeader className="pb-2">
              <div className="flex items-baseline gap-2">
                <CardTitle className="text-xs font-medium uppercase tracking-widest text-warning">
                  Team Plan
                </CardTitle>
                <span className="font-display text-2xl font-bold text-text">$29.99</span>
                <span className="text-xs text-text-muted">/ month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5">
                {TEAM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                    <Check className="h-3.5 w-3.5 shrink-0 text-warning" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => teamCheckout.mutate()}
                disabled={teamCheckout.isPending}
                variant="outline"
                className="w-full border-warning/60 text-warning hover:bg-warning/10"
              >
                {teamCheckout.isPending ? "Redirecting to checkout…" : "Team Plan — $29.99/month"}
              </Button>

              {teamCheckout.isError && (
                <p className="text-xs text-danger">{teamCheckout.error.message}</p>
              )}

              <p className="text-center text-xs text-text-muted">
                For teams · Secure payment with LemonSqueezy
              </p>
            </CardContent>
          </Card>
        )}

        {/* Manage subscription — shown when upgraded */}
        {isUpgraded && (
          <div className="rounded-lg border border-border bg-surface-2 p-4 text-center">
            <p className="text-sm text-text-muted">
              Visit the billing portal to manage your subscription.
            </p>
            <div className="mt-2 flex flex-col items-center gap-1">
              <Link
                href={LS_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent underline underline-offset-2 hover:opacity-80"
              >
                Billing History & Management →
              </Link>
              {!sub?.cancelAtPeriodEnd && (
                <button
                  onClick={() => setShowRetentionModal(true)}
                  className="text-xs text-text-muted hover:text-danger transition-colors"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          </div>
        )}

        {showRetentionModal && (
          <CancelRetentionModal
            onClose={() => setShowRetentionModal(false)}
            onCancelAnyway={() => {
              setShowRetentionModal(false);
              window.open(LS_PORTAL_URL, "_blank", "noopener,noreferrer");
            }}
          />
        )}

        <p className="text-center text-xs text-text-muted">
          Have questions?{" "}
          <a href="mailto:support@lolaicoach.gg" className="underline hover:text-text">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingPageContent />
    </Suspense>
  );
}
