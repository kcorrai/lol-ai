"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

const PRIORITY_BADGE: Record<string, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

function StrengthsList({
  strengths,
}: {
  strengths: NonNullable<CoachingReportDetail["strengths"]>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-success">Strengths</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {strengths.map((s, i) => (
          <div key={i}>
            <p className="text-sm font-semibold text-text">{s.area}</p>
            <p className="text-sm text-text-muted">{s.description}</p>
            <p className="mt-0.5 text-xs text-text-muted/70 italic">{s.evidence}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WeaknessesList({
  weaknesses,
}: {
  weaknesses: NonNullable<CoachingReportDetail["weaknesses"]>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-danger">Weaknesses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {weaknesses.map((w, i) => (
          <div key={i} className="flex gap-2">
            <Badge
              variant={PRIORITY_BADGE[w.priority] ?? "secondary"}
              className="mt-0.5 shrink-0 self-start text-xs"
            >
              {w.priority}
            </Badge>
            <div>
              <p className="text-sm font-semibold text-text">{w.area}</p>
              <p className="text-sm text-text-muted">{w.description}</p>
              {w.rootCause && (
                <p className="mt-0.5 text-xs text-text-muted/70 italic">
                  Root cause: {w.rootCause}
                </p>
              )}
              <p className="mt-0.5 text-xs text-text-muted/70 italic">{w.evidence}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActionItems({
  items,
}: {
  items: NonNullable<CoachingReportDetail["actionItems"]>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-accent">Action Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.priority} className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-background">
              {item.priority}
            </div>
            <div>
              <p className="text-sm font-semibold text-text">{item.action}</p>
              <p className="text-sm text-text-muted">{item.howTo}</p>
              <div className="mt-1 flex gap-3 text-xs text-text-muted/70">
                <span>Impact: {item.expectedImpact}</span>
                <span>·</span>
                <span>{item.timeframe}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ClimbRoadmapHeader({
  rankPotential,
  championRecs,
}: {
  rankPotential: string | null;
  championRecs: NonNullable<CoachingReportDetail["championRecommendations"]> | null;
}) {
  return (
    <div className="space-y-3">
      {rankPotential && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Estimated Rank Potential
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-accent">
            {rankPotential}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Based on your current performance trajectory
          </p>
        </div>
      )}
      {championRecs && championRecs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-accent">Champions to Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {championRecs.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant={rec.priority === "high" ? "destructive" : "warning"} className="mt-0.5 shrink-0">
                  {rec.priority}
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-text">{rec.championName}</p>
                  <p className="text-xs text-text-muted">{rec.reason}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Overlay shown when detailed analysis is gated behind Pro
function ProInsightsGate() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/30">
      {/* Blurred ghost content */}
      <div className="pointer-events-none select-none space-y-4 p-4 blur-sm">
        <div className="h-32 rounded-lg bg-surface-2" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 rounded-lg bg-surface-2" />
          <div className="h-40 rounded-lg bg-surface-2" />
        </div>
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
          <Lock className="h-5 w-5 text-accent" />
        </div>
        <p className="mt-3 font-display text-base font-semibold text-text">
          Full insights require Pro
        </p>
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
  const isClimbRoadmap = report.reportType === "climb_roadmap";

  return (
    <div className="space-y-4">
      {/* Climb Roadmap: rank potential + champion recs shown to all plans */}
      {isClimbRoadmap && (
        <ClimbRoadmapHeader
          rankPotential={report.estimatedRankPotential}
          championRecs={report.championRecommendations}
        />
      )}

      {/* Summary — visible to all plans */}
      {report.summary && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm leading-relaxed text-text">{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Coach persona — visible to all plans */}
      {report.coachPersonaResponse && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-widest text-accent">
              Coach Says
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic leading-relaxed text-text">
              {report.coachPersonaResponse}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed analysis — Pro only */}
      {isPro ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {report.strengths && report.strengths.length > 0 && (
              <StrengthsList strengths={report.strengths} />
            )}
            {report.weaknesses && report.weaknesses.length > 0 && (
              <WeaknessesList weaknesses={report.weaknesses} />
            )}
          </div>

          {report.actionItems && report.actionItems.length > 0 && (
            <ActionItems items={report.actionItems} />
          )}
        </>
      ) : (
        <ProInsightsGate />
      )}
    </div>
  );
}
