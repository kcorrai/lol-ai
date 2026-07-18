"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useReferralStats } from "@/hooks/useReferralStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SHARE_TEXT =
  "I'm climbing with LoL AI Coach — AI coaching on your own ranked games. Sign up with my link and we both get 7 days of Pro free 🎁";

export function ReferralWidget() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useReferralStats();

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://lolaicoach.gg";

  const shareUrl = data ? `${appUrl}/register?ref=${data.code}` : "";
  const enc = encodeURIComponent;
  const shareTargets = shareUrl
    ? [
        { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(SHARE_TEXT)}&url=${enc(shareUrl)}` },
        { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${SHARE_TEXT} ${shareUrl}`)}` },
        { label: "Reddit", href: `https://www.reddit.com/submit?url=${enc(shareUrl)}&title=${enc("Free 7-day Pro on LoL AI Coach")}` },
      ]
    : [];

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (!shareUrl || typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({ title: "LoL AI Coach", text: SHARE_TEXT, url: shareUrl });
    } catch {
      /* user dismissed the share sheet */
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Invite a Friend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-muted">
          When your friend signs up with your referral link and connects their Riot account, <span className="font-semibold text-accent">you both get 7 days of Pro</span>.
        </p>

        {isLoading ? (
          <div className="h-9 w-full animate-pulse rounded-lg bg-surface-2" />
        ) : (
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-muted"
            />
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        )}

        {shareUrl && (
          <div className="flex flex-wrap gap-2">
            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            )}
            {shareTargets.map((t) => (
              <a
                key={t.label}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text"
              >
                {t.label}
              </a>
            ))}
          </div>
        )}

        {data && (
          <>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="font-semibold text-text">{data.totalInvited}</p>
                <p className="text-xs text-text-muted">Invited</p>
              </div>
              <div>
                <p className="font-semibold text-success">{data.weeksEarned}</p>
                <p className="text-xs text-text-muted">Weeks earned</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{data.weeksEarned} / {data.maxWeeks} weeks</span>
                {data.weeksEarned >= data.maxWeeks && (
                  <span className="text-accent font-medium">Max rewards reached</span>
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className="h-1.5 rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min((data.weeksEarned / data.maxWeeks) * 100, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
