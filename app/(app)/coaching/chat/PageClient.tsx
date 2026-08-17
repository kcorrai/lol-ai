"use client";

import Link from "next/link";
import { CoachingChatView } from "@/domains/coaching/components/CoachingChatView";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { PageSkeleton } from "@/components/layout/PageSkeleton";

export default function CoachingChatPage(): React.JSX.Element {
  const { data: accounts, isLoading } = useRiotAccounts();

  if (isLoading) return <PageSkeleton />;

  const primary = accounts?.find((a) => a.isPrimary) ?? accounts?.[0];
  if (!primary) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-sm text-text-muted">First, connect a Riot account.</p>
        <Link href="/settings/accounts" className="mt-2 text-sm text-acid-500 underline">
          Connect Account
        </Link>
      </div>
    );
  }

  const playerLabel = `${primary.gameName}#${primary.tagLine} · ${primary.region.toUpperCase()}`;

  // The chat owns the viewport below the app chrome: the composer is pinned to
  // the bottom and only the thread scrolls, so the page itself must not.
  return (
    <div className="h-[calc(100vh-4rem)]">
      <CoachingChatView riotAccountId={primary.id} playerLabel={playerLabel} />
    </div>
  );
}
