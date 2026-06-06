"use client";

import Image from "next/image";
import Link from "next/link";
import { ListenButton } from "@/domains/coaching/components/ListenButton";
import { CheckCircle2, XCircle, Lock, Zap, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { championIconUrl, championSplashUrl } from "@/lib/ddragon";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-danger border-danger/30 bg-danger/10",
  medium: "text-warning border-warning/30 bg-warning/10",
  low: "text-text-muted border-border bg-surface-2",
};

function ReportHero({ report }: { report: CoachingReportDetail }) {
  const champion = report.championRecommendations?.[0]?.championName ?? report.focusArea ?? null;
  const splashUrl = champion ? championSplashUrl(champion) : null;

  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl border border-border">
      {splashUrl ? (
        <>
          <div
            className="h-36 w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${splashUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
        </>
      ) : (
        <div className="h-20 w-full bg-gradient-to-r from-accent/20 via-accent/5 to-transparent" />
      )}
      <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 p-4">
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-text">{report.matchesAnalyzed.length}</p>
            <p className="text-xs text-text-muted">Matches</p>
          </div>
          {report.processingTimeMs && (
            <div className="text-center">
              <p className="text-lg font-bold text-text">{(report.processingTimeMs / 1000).toFixed(0)}s</p>
              <p className="text-xs text-text-muted">AI Time</p>
            </div>
          )}
          {report.estimatedRankPotential && (
            <div className="text-center">
              <p className="text-lg font-bold text-accent">{report.estimatedRankPotential}</p>
              <p className="text-xs text-text-muted">Potential</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StrengthsList({ strengths }: { strengths: NonNullable<CoachingReportDetail["strengths"]> }) {
  return (
    <Card className="border-success/20 bg-success/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-success">
          <CheckCircle2 className="h-4 w-4" /> Strengths
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {strengths.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/20">
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">{s.area}</p>
              <p className="text-sm text-text-muted">{s.description}</p>
              <p className="mt-0.5 text-xs italic text-text-muted/70">{s.evidence}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WeaknessesList({ weaknesses }: { weaknesses: NonNullable<CoachingReportDetail["weaknesses"]> }) {
  return (
    <Card className="border-danger/20 bg-danger/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-danger">
          <XCircle className="h-4 w-4" /> Weaknesses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {weaknesses.map((w, i) => (
          <div key={i} className="flex gap-3">
            <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-xs font-semibold ${PRIORITY_COLOR[w.priority] ?? PRIORITY_COLOR.low}`}>
              {w.priority}
            </span>
            <div>
              <p className="text-sm font-semibold text-text">{w.area}</p>
              <p className="text-sm text-text-muted">{w.description}</p>
              {w.rootCause && (
                <p className="mt-0.5 text-xs italic text-text-muted/70">Root cause: {w.rootCause}</p>
              )}
              <p className="mt-0.5 text-xs italic text-text-muted/70">{w.evidence}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActionItems({ items }: { items: NonNullable<CoachingReportDetail["actionItems"]> }) {
  const icons = [Zap, Target, TrendingUp];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-accent">
          <Target className="h-4 w-4" /> Action Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, idx) => {
          const Icon = icons[idx % icons.length]!;
          return (
            <div key={item.priority} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">{item.action}</p>
                <p className="text-sm text-text-muted">{item.howTo}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">
                    {item.expectedImpact}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">
                    {item.timeframe}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ChampionRecs({ recs }: { recs: NonNullable<CoachingReportDetail["championRecommendations"]> }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-accent">Champions to Focus</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recs.map((rec, i) => (
          <div key={i} className="flex items-center gap-3">
            <Image
              src={championIconUrl(rec.championName)}
              alt={rec.championName}
              width={40}
              height={40}
              className="rounded-lg object-cover ring-1 ring-border"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text">{rec.championName}</p>
                <Badge variant={rec.priority === "high" ? "destructive" : "warning"} className="text-xs">
                  {rec.priority}
                </Badge>
              </div>
              <p className="text-xs text-text-muted">{rec.reason}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProInsightsGate() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/30">
      <div className="pointer-events-none select-none space-y-4 p-4 blur-sm">
        <div className="h-32 rounded-lg bg-surface-2" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 rounded-lg bg-surface-2" />
          <div className="h-40 rounded-lg bg-surface-2" />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
          <Lock className="h-5 w-5 text-accent" />
        </div>
        <p className="mt-3 font-display text-base font-semibold text-text">Full insights require Pro</p>
        <p className="mt-1 max-w-xs text-center text-xs text-text-muted">
          Upgrade to unlock weaknesses analysis, all action items, and champion recommendations.
        </p>
        <Link href="/settings/billing" className="mt-4">
          <Button size="sm">Upgrade to Pro</Button>
        </Link>
      </div>
    </div>
  );
}

interface Props {
  report: CoachingReportDetail;
  isPro: boolean;
}

export function CoachingReportDetail({ report, isPro }: Props) {
  return (
    <div className="space-y-4">
      <ReportHero report={report} />

      {report.summary && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm leading-relaxed text-text">{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {report.coachPersonaResponse && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-widest text-accent">Coach Says</CardTitle>
              <ListenButton reportId={report.id} text={report.coachPersonaResponse} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic leading-relaxed text-text">{report.coachPersonaResponse}</p>
          </CardContent>
        </Card>
      )}

      {isPro ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {report.strengths && report.strengths.length > 0 && <StrengthsList strengths={report.strengths} />}
            {report.weaknesses && report.weaknesses.length > 0 && <WeaknessesList weaknesses={report.weaknesses} />}
          </div>
          {report.actionItems && report.actionItems.length > 0 && <ActionItems items={report.actionItems} />}
          {report.championRecommendations && report.championRecommendations.length > 0 && (
            <ChampionRecs recs={report.championRecommendations} />
          )}
        </>
      ) : (
        <ProInsightsGate />
      )}
    </div>
  );
}
