"use client";

import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { useSubscription } from "@/hooks/useSubscription";
import { BuildExplanationPanel } from "@/domains/match/components/BuildExplanationPanel";
import { MatchTeamTable } from "@/domains/match/components/MatchTeamTable";
import { MatchPerformanceCards } from "@/domains/match/components/MatchPerformanceCards";
import { MatchAiInsight } from "@/domains/match/components/MatchAiInsight";

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading, error } = useMatchDetail(matchId);
  const { data: subscription } = useSubscription();
  const isPro = subscription?.plan === "pro" || subscription?.plan === "elite";

  if (isLoading) return <PageSkeleton />;
  if (error || !match) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <ErrorState title="Match not found" message="This match doesn't exist or you didn't participate in it." />
      </div>
    );
  }

  const durationMin = Math.floor(match.gameDuration / 60);
  const durationSec = match.gameDuration % 60;
  const userParticipant = match.participants.find((p) => p.riotAccountId === match.userRiotAccountId);
  const userWon = userParticipant?.won;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      <PageHeader
        title={match.gameMode}
        subtitle={`${new Date(match.gameStart).toLocaleString("en-US")} · ${durationMin}:${String(durationSec).padStart(2, "0")}`}
        backHref="/dashboard"
        backLabel="Dashboard"
        action={userWon !== undefined ? (
          <Badge variant={userWon ? "success" : "destructive"}>{userWon ? "Victory" : "Defeat"}</Badge>
        ) : undefined}
      />

      <MatchPerformanceCards match={match} />

      <div className="space-y-4">
        <MatchTeamTable
          participants={match.participants} teamId={100}
          userRiotAccountId={match.userRiotAccountId}
          objectives={match.teamObjectives?.["100"] ?? null}
        />
        <MatchTeamTable
          participants={match.participants} teamId={200}
          userRiotAccountId={match.userRiotAccountId}
          objectives={match.teamObjectives?.["200"] ?? null}
        />
      </div>

      <MatchAiInsight insight={match.aiInsight} />

      {userParticipant && (
        <BuildExplanationPanel
          matchId={match.id}
          puuid={userParticipant.puuid}
          isPro={isPro}
          itemIds={userParticipant.itemIds}
        />
      )}
    </div>
  );
}
