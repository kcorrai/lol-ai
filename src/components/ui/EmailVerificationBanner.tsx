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

  if (status !== "authenticated" || session.user.emailVerified || dismissed) {
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
    <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
      <MailWarning className="h-4 w-4 shrink-0 text-warning" />
      <p className="flex-1 text-warning">
        <span className="font-medium">Your email is not verified.</span> AI report generation is
        disabled — check your inbox.
      </p>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 gap-1.5 text-warning hover:bg-warning/20 hover:text-warning disabled:opacity-50"
        onClick={handleResend}
        disabled={sending || cooldownSecs > 0}
      >
        <RefreshCw className={`h-3 w-3 ${sending ? "animate-spin" : ""}`} />
        {cooldownSecs > 0 ? `${cooldownSecs}s` : "Resend"}
      </Button>
      <button
        aria-label="Close"
        onClick={() => setDismissed(true)}
        className="text-warning/60 transition-colors hover:text-warning"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
