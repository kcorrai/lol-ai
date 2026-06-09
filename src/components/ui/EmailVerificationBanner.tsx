"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { MailWarning, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailVerificationBanner() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cooldownSecs, setCooldownSecs] = useState(0);
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // After email verification redirect, update the session then clean up URL
  useEffect(() => {
    if (searchParams.get("email_verified") === "1") {
      update().then(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("email_verified");
        router.replace(url.pathname + (url.search || ""), { scroll: false });
      });
    }
  // Intentional empty deps — runs once on mount to clean up the ?email_verified=1 param.
  // Adding update/router/searchParams would re-run on every render and cause a redirect loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown tick
  useEffect(() => {
    if (cooldownSecs <= 0) return;
    const id = setTimeout(() => setCooldownSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldownSecs]);

  if (
    status !== "authenticated" ||
    session.user.emailVerified ||
    dismissed
  ) {
    return null;
  }

  async function handleResend() {
    if (sending || cooldownSecs > 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After") ?? 60);
        setCooldownSecs(retryAfter);
      } else {
        setCooldownSecs(60);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm">
      <MailWarning className="h-4 w-4 shrink-0 text-yellow-400" />
      <p className="flex-1 text-yellow-200">
        <span className="font-medium">Email adresin doğrulanmadı.</span>{" "}
        AI rapor üretimi devre dışı — gelen kutunu kontrol et.
      </p>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 gap-1.5 text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/20 disabled:opacity-50"
        onClick={handleResend}
        disabled={sending || cooldownSecs > 0}
      >
        <RefreshCw className={`h-3 w-3 ${sending ? "animate-spin" : ""}`} />
        {cooldownSecs > 0 ? `${cooldownSecs}s` : "Tekrar Gönder"}
      </Button>
      <button
        aria-label="Kapat"
        onClick={() => setDismissed(true)}
        className="text-yellow-500/60 hover:text-yellow-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
