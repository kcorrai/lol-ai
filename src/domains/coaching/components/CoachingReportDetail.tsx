"use client";

import { Badge } from "@/components/ui/badge";
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
            <Badge variant={PRIORITY_BADGE[w.priority] ?? "secondary"} className="mt-0.5 shrink-0 self-start text-xs">
              {w.priority}
            </Badge>
            <div>
              <p className="text-sm font-semibold text-text">{w.area}</p>
              <p className="text-sm text-text-muted">{w.description}</p>
              {w.rootCause && (
                <p className="mt-0.5 text-xs text-text-muted/70 italic">Root cause: {w.rootCause}</p>
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

interface Props {
  report: CoachingReportDetail;
}

export function CoachingReportDetail({ report }: Props) {
  return (
    <div className="space-y-4">
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

      {report.estimatedRankPotential && (
        <p className="text-center text-sm text-text-muted">
          Estimated rank potential:{" "}
          <span className="font-semibold text-accent">{report.estimatedRankPotential}</span>
        </p>
      )}
    </div>
  );
}
