"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInviteLink, useRevokeInviteLink } from "@/hooks/useInviteLink";

interface Props {
  teamId: string;
}

export function InviteLinkBox({ teamId }: Props) {
  const { data, isLoading } = useInviteLink(teamId);
  const revoke = useRevokeInviteLink(teamId);
  const [copied, setCopied] = useState(false);

  const joinUrl = data ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${data.token}` : "";

  function handleCopy() {
    if (!joinUrl) return;
    void navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-blue-400" />
        <p className="text-sm font-bold text-text">Shareable Invite Link</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-xs text-text-muted font-mono">
              {joinUrl}
            </p>
            <button
              onClick={handleCopy}
              title="Copy"
              className="shrink-0 rounded p-1 text-text-muted hover:text-text transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {data && (
            <p className="text-[11px] text-text-muted/60">
              Expires: {new Date(data.expiresAt).toLocaleDateString("en-US")}
            </p>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => revoke.mutate()}
            disabled={revoke.isPending}
            className="gap-1.5 text-xs text-text-muted border border-border hover:text-text"
          >
            {revoke.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Generate New Link
          </Button>
        </>
      )}
    </div>
  );
}
