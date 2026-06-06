"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { SummonerSpellIcon } from "@/components/ui/SummonerSpellIcon";
import { runePathIconUrl, keystoneIconUrl, rankEmblemUrl } from "@/lib/ddragon";
import { BuildExplanationPanel } from "@/domains/match/components/BuildExplanationPanel";
import { useSubscription } from "@/hooks/useSubscription";
import type { ParticipantDetail, AiInsight, MatchDetail, TeamObjectives } from "@/domains/match";

function fmt(n: number, d = 1) { return n.toFixed(d); }
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

const POSITION_LABELS: Record<string, string> = {
  TOP: "Top", JUNGLE: "Jungle", MIDDLE: "Mid", BOTTOM: "ADC", UTILITY: "Support",
};

const POSITION_ORDER: Record<string, number> = {
  TOP: 0, JUNGLE: 1, MIDDLE: 2, BOTTOM: 3, UTILITY: 4,
};

const RANK_TIER_COLOR: Record<string, string> = {
  IRON:        "text-gray-400",
  BRONZE:      "text-amber-700",
  SILVER:      "text-gray-300",
  GOLD:        "text-yellow-400",
  PLATINUM:    "text-teal-400",
  EMERALD:     "text-emerald-400",
  DIAMOND:     "text-blue-400",
  MASTER:      "text-purple-400",
  GRANDMASTER: "text-purple-400",
  CHALLENGER:  "text-purple-400",
};

function RankBadge({ tier, division, lp }: { tier: string | null; division: string | null; lp: number | null }) {
  if (!tier) {
    return <span className="text-[10px] text-text-muted">—</span>;
  }
  const color = RANK_TIER_COLOR[tier] ?? "text-text-muted";
  const apexTiers = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);
  const divisionStr = apexTiers.has(tier) ? "" : ` ${division ?? ""}`;
  const emblemUrl = rankEmblemUrl(tier);
  return (
    <div className="flex items-center gap-1">
      {emblemUrl && (
        <Image src={emblemUrl} alt={tier} width={20} height={20} unoptimized className="shrink-0" />
      )}
      <span className={`text-[10px] font-medium ${color}`}>
        {tier.charAt(0)}{tier.slice(1).toLowerCase()}{divisionStr}{lp !== null ? ` · ${lp} LP` : ""}
      </span>
    </div>
  );
}

function RuneIcons({ keystone, secondaryPath }: { keystone: number | null; secondaryPath: number | null }) {
  const [k1err, setK1err] = useState(false);
  const [k2err, setK2err] = useState(false);
  const kUrl = keystone ? keystoneIconUrl(keystone) : "";
  const sUrl = secondaryPath ? runePathIconUrl(secondaryPath) : "";
  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      {kUrl && !k1err ? (
        <Image src={kUrl} alt="keystone" width={16} height={16} className="rounded-sm" onError={() => setK1err(true)} unoptimized />
      ) : <span className="h-4 w-4 rounded-sm bg-surface-2" />}
      {sUrl && !k2err ? (
        <Image src={sUrl} alt="secondary rune" width={16} height={16} className="rounded-sm opacity-70" onError={() => setK2err(true)} unoptimized />
      ) : <span className="h-4 w-4 rounded-sm bg-surface-2" />}
    </div>
  );
}

function ObjectivePip({ icon, count, label }: { icon: string; count: number; label: string }) {
  return (
    <span title={label} className="flex items-center gap-1 text-xs">
      <span>{icon}</span>
      <span className="font-semibold text-text">{count}</span>
    </span>
  );
}

function TeamHeader({ team, won, objectives }: { team: ParticipantDetail[]; won: boolean; objectives: TeamObjectives | null }) {
  const totalKills = team.reduce((s, p) => s + p.kills, 0);
  const totalDmg   = team.reduce((s, p) => s + p.damageDealt, 0);
  const totalGold  = team.reduce((s, p) => s + p.goldEarned, 0);
  const totalCS    = team.reduce((s, p) => s + p.cs, 0);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-t-lg border-b border-border px-4 py-2.5 ${won ? "bg-success/10" : "bg-danger/10"}`}>
      <span className={`text-xs font-bold uppercase tracking-widest ${won ? "text-success" : "text-danger"}`}>
        {won ? "Victory" : "Defeat"}
      </span>
      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span><span className="font-semibold text-text">{totalKills}</span> Kills</span>
        <span><span className="font-semibold text-text">{fmtK(totalDmg)}</span> Dmg</span>
        <span><span className="font-semibold text-text">{fmtK(totalGold)}</span> Gold</span>
        <span><span className="font-semibold text-text">{totalCS}</span> CS</span>
        {objectives && (
          <>
            <ObjectivePip icon="🏰" count={objectives.towers}    label="Towers" />
            <ObjectivePip icon="🐉" count={objectives.dragons}   label="Dragons" />
            <ObjectivePip icon="👁️" count={objectives.heralds}   label="Rift Heralds" />
            <ObjectivePip icon="💀" count={objectives.barons}    label="Barons" />
            <ObjectivePip icon="🔴" count={objectives.inhibitors} label="Inhibitors" />
          </>
        )}
      </div>
    </div>
  );
}

function TeamTable({ participants, teamId, userRiotAccountId, objectives }: {
  participants: ParticipantDetail[];
  teamId: number;
  userRiotAccountId: string | null;
  objectives: TeamObjectives | null;
}) {
  const team = participants
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => (POSITION_ORDER[a.position] ?? 5) - (POSITION_ORDER[b.position] ?? 5));
  const won = team[0]?.won ?? false;
  const maxDmgDealt = Math.max(...team.map((p) => p.damageDealt), 1);
  const maxDmgTaken = Math.max(...team.map((p) => p.damageTaken), 1);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <TeamHeader team={team} won={won} objectives={objectives} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-text-muted">
              <th className="px-3 py-2 text-left">Champion</th>
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-center">K / D / A</th>
              <th className="px-3 py-2 text-center">CS</th>
              <th className="px-3 py-2 text-center">Dealt</th>
              <th className="px-3 py-2 text-center">Taken</th>
              <th className="px-3 py-2 text-center">Gold</th>
              <th className="px-3 py-2 text-center">Vision</th>
              <th className="px-3 py-2 text-left">Items</th>
            </tr>
          </thead>
          <tbody>
            {team.map((p) => {
              const isUser = p.riotAccountId === userRiotAccountId;
              const kp = Math.round(p.killParticipation * 100);
              return (
                <tr key={p.id} className={`border-b border-border last:border-0 ${isUser ? "bg-accent/10" : "bg-surface"}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <SummonerSpellIcon spellId={p.summonerSpell1} size={16} />
                        <SummonerSpellIcon spellId={p.summonerSpell2} size={16} />
                      </div>
                      <RuneIcons keystone={p.runePrimaryKeystone} secondaryPath={p.runeSecondaryPath} />
                      <ChampionIcon name={p.championName} size={32} className="shrink-0" />
                      <div className="min-w-0">
                        <p className={`truncate font-medium ${isUser ? "text-accent" : "text-text"}`}>{p.championName}</p>
                        {p.gameName && (
                          <p className="truncate text-[10px] text-text-muted">{p.gameName}<span className="text-text-muted/50">#{p.tagLine}</span></p>
                        )}
                        <p className="text-[10px] text-text-muted/60">
                          {POSITION_LABELS[p.position] ?? p.position}{isUser ? " · you" : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <RankBadge tier={p.rankTier} division={p.rankDivision} lp={p.rankLp} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <p className="font-semibold text-text">{p.kills}/<span className="text-danger">{p.deaths}</span>/{p.assists}</p>
                    <p className="text-[10px] text-text-muted">{kp}% KP</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <p className="text-text">{p.cs}</p>
                    <p className="text-[10px] text-text-muted">{fmt(p.csPerMinute)}/m</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-text">{fmtK(p.damageDealt)}</span>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-danger/70" style={{ width: `${(p.damageDealt / maxDmgDealt) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-text-muted">{fmtK(p.damageTaken)}</span>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-warning/60" style={{ width: `${(p.damageTaken / maxDmgTaken) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-text-muted">{fmtK(p.goldEarned)}</td>
                  <td className="px-3 py-2.5 text-center text-text">{p.visionScore}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-0.5">
                      {(p.itemIds ?? []).slice(0, 6).map((id, i) => <ItemIcon key={i} itemId={id} size={28} />)}
                    </div>
                  </td>
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
  const user = match.participants.find((p) => p.riotAccountId === match.userRiotAccountId);
  if (!user) return null;
  const cards = [
    { label: "KDA",        value: fmt(user.kda, 2) },
    { label: "Kill Part.", value: `${fmt(user.killParticipation * 100)}%` },
    { label: "CS / min",   value: fmt(user.csPerMinute) },
    { label: "Dmg Share",  value: `${fmt(user.damageShare * 100)}%` },
    { label: "Vision",     value: String(user.visionScore) },
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
  const strengths  = Array.isArray(insight.strengths)  ? insight.strengths  as Array<{ area: string; description: string }> : [];
  const weaknesses = Array.isArray(insight.weaknesses) ? insight.weaknesses as Array<{ area: string; description: string; priority: string }> : [];
  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-accent uppercase tracking-widest">AI Insight</CardTitle>
          <Link href={`/coaching/${insight.reportId}`} className="text-xs text-text-muted hover:text-accent">Full report →</Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-text">{insight.summary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {strengths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-success">Strengths</p>
              {strengths.slice(0, 2).map((s, i) => <p key={i} className="text-xs text-text-muted">· {s.area}: {s.description}</p>)}
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-danger">Weaknesses</p>
              {weaknesses.slice(0, 2).map((w, i) => <p key={i} className="text-xs text-text-muted">· {w.area}: {w.description}</p>)}
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
  const userWon = match.participants.find((p) => p.riotAccountId === match.userRiotAccountId)?.won;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      <PageHeader
        title={match.gameMode}
        subtitle={`${new Date(match.gameStart).toLocaleString()} · ${durationMin}:${String(durationSec).padStart(2, "0")}`}
        backHref="/dashboard"
        backLabel="Dashboard"
        action={userWon !== undefined ? (
          <Badge variant={userWon ? "success" : "destructive"}>{userWon ? "Victory" : "Defeat"}</Badge>
        ) : undefined}
      />

      <PerformanceCards match={match} />

      <div className="space-y-4">
        <TeamTable
          participants={match.participants} teamId={100}
          userRiotAccountId={match.userRiotAccountId}
          objectives={match.teamObjectives?.["100"] ?? null}
        />
        <TeamTable
          participants={match.participants} teamId={200}
          userRiotAccountId={match.userRiotAccountId}
          objectives={match.teamObjectives?.["200"] ?? null}
        />
      </div>

      <AiInsightSection insight={match.aiInsight} />

      {(() => {
        const userP = match.participants.find(
          (p) => p.riotAccountId === match.userRiotAccountId
        );
        if (!userP) return null;
        return (
          <BuildExplanationPanel
            matchId={match.id}
            puuid={userP.puuid}
            isPro={isPro}
            itemIds={userP.itemIds}
          />
        );
      })()}
    </div>
  );
}
