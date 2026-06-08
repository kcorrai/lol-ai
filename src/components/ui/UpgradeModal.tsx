"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateCheckout } from "@/hooks/useCreateCheckout";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "REPORT_LIMIT_REACHED" | "DAILY_REPORT_LIMIT_REACHED" | "PRO_REQUIRED" | string;
}

const PRO_FEATURES = [
  "Sınırsız AI koçluk raporu",
  "Pro oyuncu karşılaştırması",
  "Haftalık performans özeti",
  "Öncelikli AI modeli (GPT-4o)",
  "Çoklu hesap takibi",
];

const REASON_COPY: Record<string, { title: string; subtitle: string }> = {
  REPORT_LIMIT_REACHED: {
    title: "Aylık rapor limitine ulaştın",
    subtitle: "Pro'ya geçerek sınırsız AI koçluk raporu al.",
  },
  DAILY_REPORT_LIMIT_REACHED: {
    title: "Günlük rapor limitine ulaştın",
    subtitle: "Yarın tekrar dene veya Pro ile sınırsız rapor oluştur.",
  },
  PRO_REQUIRED: {
    title: "Bu özellik Pro üyelere özel",
    subtitle: "Pro'ya geç ve tüm özelliklere anında eriş.",
  },
};

const DEFAULT_COPY = {
  title: "Pro'ya Geç",
  subtitle: "Tüm özelliklere sınırsız erişim için Pro planını dene.",
};

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const checkout = useCreateCheckout("monthly");

  if (!open) return null;

  const copy = (reason ? REASON_COPY[reason] : undefined) ?? DEFAULT_COPY;

  function handleUpgrade() {
    if (!session) {
      router.push("/register");
      return;
    }
    checkout.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-accent/30 bg-surface p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted hover:text-text transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Zap className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">{copy.title}</h2>
            <p className="text-xs text-text-muted">{copy.subtitle}</p>
          </div>
        </div>

        <ul className="mb-6 space-y-2">
          {PRO_FEATURES.map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-sm text-text-muted">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
              {feat}
            </li>
          ))}
        </ul>

        <div className="mb-4 rounded-xl border border-border bg-background px-4 py-3 text-center">
          <span className="text-2xl font-black text-text">₺199</span>
          <span className="text-sm text-text-muted"> / ay</span>
        </div>

        <Button
          className="w-full"
          onClick={handleUpgrade}
          disabled={checkout.isPending}
        >
          {checkout.isPending ? "Yönlendiriliyor..." : session ? "Pro'ya Geç →" : "Ücretsiz Başla →"}
        </Button>
      </div>
    </div>
  );
}
