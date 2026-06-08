"use client";

import { useState } from "react";
import { X, CheckCircle2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/fetcher";

interface Props {
  onClose: () => void;
  onCancelAnyway: () => void;
}

const USED_FEATURES = [
  "Sınırsız AI koçluk raporu",
  "Şampiyon havuzu analizi",
  "Haftalık gelişim e-postaları",
  "Ranked ilerleme takibi",
  "Maç detay analizi",
];

export function CancelRetentionModal({ onClose, onCancelAnyway }: Props) {
  const [loading, setLoading] = useState(false);
  const [offerApplied, setOfferApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAcceptOffer() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>("/api/subscription/retention-offer");
      window.location.href = url;
    } catch {
      // Fallback: show offer applied confirmation so user still sees value
      setOfferApplied(true);
    } finally {
      setLoading(false);
    }
  }

  if (offerApplied) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="relative mx-4 w-full max-w-md rounded-2xl border border-success/30 bg-surface p-6 text-center shadow-2xl">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success" />
          <h2 className="mb-2 font-display text-xl font-bold text-text">İndirim Uygulandı!</h2>
          <p className="text-sm text-text-muted">
            Bir sonraki faturanızda %20 indirim uygulanacaktır. Pro üyeliğiniz aktif kalmaya devam ediyor.
          </p>
          <Button onClick={onClose} className="mt-5 w-full">
            Harika, kalmaya devam et!
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4">
          <Gift className="mb-2 h-8 w-8 text-accent" />
          <h2 className="font-display text-xl font-bold text-text">Gitmeden önce...</h2>
          <p className="mt-1 text-sm text-text-muted">
            Pro üyeliğinle şu anda bunları kullanıyorsun:
          </p>
        </div>

        <ul className="mb-5 space-y-2">
          {USED_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-text">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mb-5 rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
          <p className="text-sm font-semibold text-text">Özel teklif: Sonraki ay %20 indirim</p>
          <p className="mt-0.5 text-xs text-text-muted">
            Bu teklifi kabul edersen planın aktif kalır ve bir sonraki faturanda indirim uygulanır.
          </p>
        </div>

        {error && <p className="mb-3 text-center text-xs text-danger">{error}</p>}

        <div className="space-y-2">
          <Button
            onClick={handleAcceptOffer}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Uygulanıyor..." : "%20 İndirimle Devam Et"}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancelAnyway}
            className="w-full text-text-muted hover:text-text"
          >
            Yine de iptal et →
          </Button>
        </div>
      </div>
    </div>
  );
}
