"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import type { ParticipantDetail, AiInsight, MatchDetail } from "@/domains/match";

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

function TeamTable({
  participants,
  teamId,
  userRiotAccountId,
}: {
  participants: ParticipantDetail[];
  teamId: number;
  userRiotAccountId: string | null;
}) {
  const team = participants.filter((p) => p.teamId === teamId);
  const won = team[0]?.won;

  return (
    <div>
      <p className={`mb-1 text-xs font-semibold uppercase tracking-widest ${won ? "text-success" : "text-danger"}`}>
        {teamId === 100 ? "Blue Team" : "Red Team"} — {won ? "Victory" : "Defeat"}
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-text-muted">
              <th className="px-3 py-2 text-left">Champion</th>
              <th className="px-3 py-2 text-center">K/D/A</th>
              <th className="px-3 py-2 text-center">CS</th>
              <th className="px-3 py-2 text-center">Gold</th>
              <th className="px-3 py-2 text-center">Damage</th>
              <th className="px-3 py-2 text-center">Vision</th>
            </tr>
          </thead>
          <tbody>
            {team.map((p) => {
              const isUser = p.riotAccountId === userRiotAccountId;
              return (
                <tr
                  key={p.id}
                  className={`border-b border-border last:border-0 ${isUser ? "bg-accent/10 font-semibold" : "bg-surface"}`}
                >
                  <td className="px-3 py-2">
                    <span className="text-text">{p.championName}</span>
                    <span className="ml-1.5 text-text-muted">{p.position}</span>
                    {isUser && <span className="ml-1.5 text-accent text-xs">(you)</span>}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {p.kills}/<span className="text-danger">{p.deaths}</span>/{p.assists}
                  </td>
                  <td className="px-3 py-2 text-center">{p.cs}</td>
                  <td className="px-3 py-2 text-center">{fmt(p.goldEarned / 1000)}k</td>
                  <td className="px-3 py-2 text-center">{fmt(p.damageDealt / 1000)}k</td>
                  <td className="px-3 py-2 text-center">{p.visionScore}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PerformanceCards({ match }: { match: MatchDetail }) {
  const user = match.participants.find(
    (p) => p.riotAccountId === match.userRiotAccountId
  );
  if (!user) return null;

  const cards = [
    { label: "KDA", value: fmt(user.kda, 2) },
    { label: "CS / min", value: fmt(user.csPerMinute) },
    { label: "Kill Part.", value: `${fmt(user.killParticipation * 100)}%` },
    { label: "Dmg Share", value: `${fmt(user.damageShare * 100)}%` },
    { label: "Vision", value: String(user.visionScore) },
    { label: "Gold / min", value: fmt(user.goldPerMinute) },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {cards.map(({ label, value }) => (
        <Card key={label}>
          <CardHeader className="pb-0 pt-3 px-3">
            <CardTitle className="text-xs text-text-muted uppercase tracking-widest">{label}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-1">
            <p className="text-lg font-bold text-text">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AiInsightSection({ insight }: { insight: AiInsight }) {
  if (!insight) return null;

  const strengths = Array.isArray(insight.strengths) ? insight.strengths as Array<{ area: string; description: string }> : [];
  const weaknesses = Array.isArray(insight.weaknesses) ? insight.weaknesses as Array<{ area: string; description: string; priority: string }> : [];

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-accent uppercase tracking-widest">AI Insight</CardTitle>
          <Link href={`/coaching/${insight.reportId}`} className="text-xs text-text-muted hover:text-accent">
            Full report →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-text">{insight.summary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {strengths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-success">Strengths</p>
              {strengths.slice(0, 2).map((s, i) => (
                <p key={i} className="text-xs text-text-muted">· {s.area}: {s.description}</p>
              ))}
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-danger">Weaknesses</p>
              {weaknesses.slice(0, 2).map((w, i) => (
                <p key={i} className="text-xs text-text-muted">· {w.area}: {w.description}</p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading, error } = useMatchDetail(matchId);

  if (isLoading) return <PageSkeleton />;

  if (error || !match) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ErrorState title="Match not found" message="This match doesn't exist or you didn't participate in it." />
      </div>
    );
  }

  const durationMin = Math.floor(match.gameDuration / 60);
  const durationSec = match.gameDuration % 60;
  const userWon = match.participants.find((p) => p.riotAccountId === match.userRiotAccountId)?.won;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <PageHeader
        title={match.gameMode}
        subtitle={`${new Date(match.gameStart).toLocaleString()} · ${durationMin}:${String(durationSec).padStart(2, "0")}`}
        backHref="/dashboard"
        backLabel="Dashboard"
        action={
          userWon !== undefined ? (
            <Badge variant={userWon ? "success" : "destructive"}>
              {userWon ? "Victory" : "Defeat"}
            </Badge>
          ) : undefined
        }
      />

      <PerformanceCards match={match} />

      <div className="space-y-3">
        <TeamTable participants={match.participants} teamId={100} userRiotAccountId={match.userRiotAccountId} />
        <TeamTable participants={match.participants} teamId={200} userRiotAccountId={match.userRiotAccountId} />
      </div>

      <AiInsightSection insight={match.aiInsight} />
    </div>
  );
}
