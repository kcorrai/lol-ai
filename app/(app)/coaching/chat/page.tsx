"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CoachingChatView } from "@/domains/coaching/components/CoachingChatView";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { PageSkeleton } from "@/components/layout/PageSkeleton";

export default function CoachingChatPage() {
  const { data: accounts, isLoading } = useRiotAccounts();

  if (isLoading) return <PageSkeleton />;

  const primary = accounts?.[0];
  if (!primary) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-sm text-text-muted">Connect a Riot account first.</p>
        <Link href="/settings/accounts" className="mt-2 text-sm text-accent underline">
          Connect account
        </Link>
      </div>
    );
  }

  const playerLabel = `${primary.gameName}#${primary.tagLine} · ${primary.region.toUpperCase()}`;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col">
      <div className="border-b border-border px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        <CoachingChatView
          riotAccountId={primary.id}
          playerLabel={playerLabel}
        />
      </div>
    </div>
  );
}
