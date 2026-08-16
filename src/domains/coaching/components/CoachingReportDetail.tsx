"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportVerdict } from "@/domains/coaching/components/report/ReportVerdict";
import { ReportFindings } from "@/domains/coaching/components/report/ReportFindings";
import { ReportChampions, ReportPlan } from "@/domains/coaching/components/report/ReportPlan";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

function ProInsightsGate(): React.ReactElement {
  return (
    <div className="notch relative overflow-hidden border border-accent/30">
      <div className="pointer-events-none select-none space-y-4 p-4 blur-sm" aria-hidden>
        <div className="h-32 bg-surface-2" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 bg-surface-2" />
          <div className="h-40 bg-surface-2" />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
          <Lock className="h-5 w-5 text-accent" />
        </div>
        <p className="mt-3 font-display text-base font-semibold text-text">
          All insights require Pro
        </p>
        <p className="mt-1 max-w-xs text-center text-xs text-text-muted">
          Upgrade to Pro for weaknesses, all action items, and champion recommendations.
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

/** The report body: the verdict, then what it found, then what to do about it. */
export function CoachingReportDetail({ report, isPro }: Props): React.ReactElement {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <ReportVerdict report={report} isPro={isPro} />

      {isPro ? (
        <>
          <ReportFindings report={report} />
          {report.actionItems && report.actionItems.length > 0 && (
            <ReportPlan items={report.actionItems} />
          )}
          {report.championRecommendations && report.championRecommendations.length > 0 && (
            <ReportChampions recs={report.championRecommendations} />
          )}
        </>
      ) : (
        <ProInsightsGate />
      )}
    </div>
  );
}
