"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { useCreateCheckout } from "@/hooks/useCreateCheckout";

const PLAN_FEATURES = {
  free: ["3 AI coaching reports / month", "1 Riot account", "Last 10 matches"],
  pro: ["Unlimited AI coaching reports", "Up to 3 Riot accounts", "Last 100 matches"],
} as const;

export default function BillingPage() {
  const { data: sub, isLoading } = useSubscription();
  const checkout = useCreateCheckout();

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  return (
    <div className="mx-auto max-w-lg p-8">
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription and plan."
      />

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-muted uppercase tracking-widest">
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-display font-bold text-text">
                  {isPro ? "Pro" : "Free"}
                </span>
                <Badge variant={isPro ? "success" : "secondary"}>
                  {isPro ? "Active" : "Free tier"}
                </Badge>
              </div>
              <ul className="space-y-1">
                {PLAN_FEATURES[isPro ? "pro" : "free"].map((f) => (
                  <li key={f} className="text-sm text-text-muted">
                    · {f}
                  </li>
                ))}
              </ul>
              {sub?.currentPeriodEnd && isPro && (
                <p className="text-xs text-text-muted">
                  {sub.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          {!isPro && (
            <Card className="border-accent/40 bg-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-accent uppercase tracking-widest">
                  Upgrade to Pro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1">
                  {PLAN_FEATURES.pro.map((f) => (
                    <li key={f} className="text-sm text-text-muted">
                      · {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending}
                  className="w-full"
                >
                  {checkout.isPending ? "Redirecting…" : "Upgrade to Pro"}
                </Button>
                {checkout.isError && (
                  <p className="text-xs text-danger">{checkout.error.message}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
