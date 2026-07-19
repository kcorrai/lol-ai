"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchDetail } from "@/domains/match";

function fmt(n: number, d = 1) { return n.toFixed(d); }

interface Props {
  match: MatchDetail;
}

export function MatchPerformanceCards({ match }: Props) {
  const user = match.participants.find((p) => p.puuid === match.userPuuid);
  if (!user) return null;
  const cards = [
    { label: "KDA",        value: fmt(user.kda, 2) },
    { label: "Kill Part.", value: `${fmt(user.killParticipation * 100)}%` },
    { label: "CS/min",     value: fmt(user.csPerMinute) },
    { label: "Dmg Share",  value: `${fmt(user.damageShare * 100)}%` },
    { label: "Vision",     value: String(user.visionScore) },
    { label: "Gold/min",   value: fmt(user.goldPerMinute) },
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
