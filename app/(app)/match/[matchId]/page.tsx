"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { useSubscription } from "@/hooks/useSubscription";
import { BuildExplanationPanel } from "@/domains/match/components/BuildExplanationPanel";
import { MatchResultHeader } from "@/domains/match/components/MatchResultHeader";
import { MatchKpiStrip } from "@/domains/match/components/MatchKpiStrip";
import { MatchScoreboard } from "@/domains/match/components/MatchScoreboard";
import { MatchDetailRail } from "@/domains/match/components/MatchDetailRail";
import { LanePhaseChart } from "@/domains/match/components/LanePhaseChart";

export default function MatchDetailPage(): React.JSX.Element {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading, error } = useMatchDetail(matchId);
  const { data: subscription } = useSubscription();
  const isPro = subscription?.plan === "pro" || subscription?.plan === "elite";

  if (isLoading) return <PageSkeleton />;
  if (error || !match) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <ErrorState
          title="Match not found"
          message="This match doesn't exist or you didn't participate in it."
        />
      </div>
    );
  }

  const me = match.participants.find((p) => p.puuid === match.userPuuid);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-line-1 bg-surface/70 px-5 backdrop-blur md:px-8">
        <Link
          href="/dashboard"
          className="font-mono text-[10.5px] uppercase tracking-label text-fg-3 hover:text-fg-1"
        >
          ← Dashboard
        </Link>
        <span className="h-4 w-px bg-line-2" />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-fg-1">
          Match detail
        </span>
        {match.aiInsight && (
          <Link
            href={`/coaching/${match.aiInsight.reportId}`}
            className="notch-sm ml-auto inline-flex items-center gap-2 border border-line-2 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-label text-fg-2 transition-colors hover:border-acid-500 hover:text-acid-500"
          >
            Full AI report →
          </Link>
        )}
      </header>

      <MatchResultHeader match={match} me={me} />

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-5 md:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_306px]">
          <div className="grid min-w-0 gap-4">
            {me && <MatchKpiStrip me={me} participants={match.participants} />}

            {me && <LanePhaseChart matchId={match.id} />}

            <MatchScoreboard
              participants={match.participants}
              userPuuid={match.userPuuid}
              winningTeam={match.winningTeam}
              objectives={match.teamObjectives}
            />

            {me && (
              <BuildExplanationPanel
                matchId={match.id}
                puuid={me.puuid}
                isPro={isPro}
                itemIds={me.itemIds}
              />
            )}
          </div>

          <MatchDetailRail match={match} me={me} />
        </div>
      </div>
    </div>
  );
}
