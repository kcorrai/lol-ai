"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiInsight } from "@/domains/match";

interface Props {
  insight: AiInsight;
}

export function MatchAiInsight({ insight }: Props) {
  if (!insight) return null;
  const strengths  = Array.isArray(insight.strengths)  ? insight.strengths  as Array<{ area: string; description: string }> : [];
  const weaknesses = Array.isArray(insight.weaknesses) ? insight.weaknesses as Array<{ area: string; description: string; priority: string }> : [];
  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-accent uppercase tracking-widest">AI İçgörüsü</CardTitle>
          <Link href={`/coaching/${insight.reportId}`} className="text-xs text-text-muted hover:text-accent">Tam Rapor →</Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-text">{insight.summary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {strengths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-success">Güçlü Yönler</p>
              {strengths.slice(0, 2).map((s, i) => <p key={i} className="text-xs text-text-muted">· {s.area}: {s.description}</p>)}
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-danger">Zayıf Yönler</p>
              {weaknesses.slice(0, 2).map((w, i) => <p key={i} className="text-xs text-text-muted">· {w.area}: {w.description}</p>)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
