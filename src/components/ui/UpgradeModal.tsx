"use client";

import * as Dialog from "@radix-ui/react-dialog";
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
  "Unlimited AI coaching report",
  "Pro player comparison",
  "Weekly performance summary",
  "Priority AI model (GPT-4o)",
  "Multiple account tracking",
];

const REASON_COPY: Record<string, { title: string; subtitle: string }> = {
  REPORT_LIMIT_REACHED: {
    title: "You've reached your monthly report limit",
    subtitle: "Upgrade to Pro to get unlimited AI coaching reports.",
  },
  DAILY_REPORT_LIMIT_REACHED: {
    title: "You've reached your daily report limit",
    subtitle: "Try again tomorrow or create unlimited reports with Pro.",
  },
  PRO_REQUIRED: {
    title: "This feature is exclusive to Pro members",
    subtitle: "Upgrade to Pro and access all features instantly.",
  },
};

const DEFAULT_COPY = {
  title: "Upgrade to Pro",
  subtitle: "Try the Pro plan for unlimited access to all features.",
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
    <Dialog.Root open onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-accent/30 bg-surface p-6 shadow-2xl">
          {/* Was a bare <div> backdrop with an onClick — dismissal was mouse-only. */}
          <Dialog.Close
            aria-label="Close"
            className="absolute right-4 top-4 text-text-muted hover:text-text transition-colors"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>

          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-bold text-text">{copy.title}</Dialog.Title>
              <Dialog.Description className="text-xs text-text-muted">
                {copy.subtitle}
              </Dialog.Description>
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
            <span className="text-sm text-text-muted"> / month</span>
          </div>

          <Button
            className="w-full"
            onClick={handleUpgrade}
            disabled={checkout.isPending}
          >
            {checkout.isPending ? "Redirecting..." : session ? "Upgrade to Pro →" : "Get Started Free →"}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
