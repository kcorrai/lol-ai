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
import { useSearchParams } from "next/navigation";

const FREE_FEATURES = [
  "Ayda 3 AI koçluk raporu",
  "1 Riot hesabı",
  "Son 10 maç",
  "Maç detay analizi",
  "Ranked ilerleme takibi",
];

const PRO_FEATURES = [
  "Sınırsız AI koçluk raporu",
  "3'e kadar Riot hesabı",
  "Son 100 maç",
  "Maç detay analizi",
  "Ranked ilerleme takibi",
  "Şampiyon havuzu analizi",
  "Haftalık gelişim e-postaları",
  "Öncelikli AI işleme",
];

export default function BillingPage() {
  const { data: sub, isLoading } = useSubscription();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") === "annual" ? "annual" : "monthly";
  const checkout = useCreateCheckout(period);

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <PageHeader title="Fatura" subtitle="Aboneliğini ve planını yönet." />
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
      <PageHeader title="Fatura" subtitle="Aboneliğini ve planını yönet." />

      <div className="space-y-4">
        {/* Current plan card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
              Mevcut Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl font-bold text-text">
                {isPro ? "Pro" : "Free"}
              </span>
              <Badge variant={isPro ? "success" : "secondary"}>
                {sub?.status === "trialing"
                  ? "Deneme"
                  : isPro
                    ? "Aktif"
                    : "Ücretsiz"}
              </Badge>
              {sub?.cancelAtPeriodEnd && (
                <Badge variant="warning">Dönem sonunda iptal</Badge>
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
                {sub.cancelAtPeriodEnd ? "Erişim sona eriyor:" : "Yenileniyor:"}{" "}
                {new Date(sub.currentPeriodEnd).toLocaleDateString("tr-TR")}
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
                  Pro&apos;ya Yükselt
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
                {checkout.isPending ? "Ödeme sayfasına yönlendiriliyor…" : "Pro&apos;ya Yükselt — $9.99/ay"}
              </Button>

              {checkout.isError && (
                <p className="text-xs text-danger">{checkout.error.message}</p>
              )}

              <p className="text-center text-xs text-text-muted">
                LemonSqueezy ile güvenli ödeme · İstediğin zaman iptal et
              </p>
            </CardContent>
          </Card>
        )}

        {/* Manage subscription — shown when Pro */}
        {isPro && (
          <div className="rounded-lg border border-border bg-surface-2 p-4 text-center">
            <p className="text-sm text-text-muted">
              Aboneliğini yönetmek veya iptal etmek için faturalandırma portalını ziyaret et.
            </p>
            <Link
              href="https://app.lemonsqueezy.com/my-orders"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-accent underline underline-offset-2 hover:opacity-80"
            >
              Aboneliği Yönet →
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-text-muted">
          Soruların mı var?{" "}
          <a href="mailto:support@lolaicoach.gg" className="underline hover:text-text">
            Destek ile iletişime geç
          </a>
        </p>
      </div>
    </div>
  );
}
