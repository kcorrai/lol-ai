"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreateCheckout } from "@/hooks/useCreateCheckout";

const FREE_FEATURES = [
  "3 AI coaching reports / month",
  "1 Riot account",
  "Last 10 matches",
  "Match deep dive",
  "Ranked progress tracking",
];

const PRO_FEATURES = [
  "Unlimited AI coaching reports",
  "Up to 3 Riot accounts",
  "Last 100 matches",
  "Match deep dive",
  "Ranked progress tracking",
  "Champion pool analytics",
  "Weekly improvement emails",
  "Priority AI processing",
];

export default function BillingPage() {
  const { data: sub, isLoading } = useSubscription();
  const checkout = useCreateCheckout();

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

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
                {isPro ? "Pro" : "Free"}
              </span>
              <Badge variant={isPro ? "success" : "secondary"}>
                {sub?.status === "trialing"
                  ? "Trial"
                  : isPro
                    ? "Active"
                    : "Free tier"}
              </Badge>
              {sub?.cancelAtPeriodEnd && (
                <Badge variant="warning">Cancels at period end</Badge>
              )}
            </div>

            <ul className="space-y-1.5">
              {(isPro ? PRO_FEATURES : FREE_FEATURES).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                  <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>

            {sub?.currentPeriodEnd && isPro && (
              <p className="text-xs text-text-muted">
                {sub.cancelAtPeriodEnd ? "Access until" : "Renews"}{" "}
                {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upgrade card — shown only when not Pro */}
        {!isPro && (
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
                {checkout.isPending ? "Redirecting to checkout…" : "Upgrade to Pro — $9.99/mo"}
              </Button>

              {checkout.isError && (
                <p className="text-xs text-danger">{checkout.error.message}</p>
              )}

              <p className="text-center text-xs text-text-muted">
                Secure checkout via LemonSqueezy · Cancel anytime
              </p>
            </CardContent>
          </Card>
        )}

        {/* Manage subscription — shown when Pro */}
        {isPro && (
          <div className="rounded-lg border border-border bg-surface-2 p-4 text-center">
            <p className="text-sm text-text-muted">
              To manage or cancel your subscription, visit your billing portal.
            </p>
            <Link
              href="https://app.lemonsqueezy.com/my-orders"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-accent underline underline-offset-2 hover:opacity-80"
            >
              Manage subscription →
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-text-muted">
          Questions?{" "}
          <a href="mailto:support@lolaicoach.gg" className="underline hover:text-text">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
