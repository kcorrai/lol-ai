"use client";

import Link from "next/link";
import { Download, Mic } from "lucide-react";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
import { ReportRating } from "@/domains/coaching/components/ReportRating";
import { ShareReportButton } from "@/domains/coaching/components/ShareReportButton";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

const PANEL = "notch border border-border bg-surface";
const ACTION =
  "notch-sm flex h-9 w-full items-center justify-center gap-2 border border-border bg-surface-2 font-mono text-[11px] uppercase tracking-label text-text-body transition-colors hover:border-accent/50 hover:text-text";

const MATCHES_SHOWN = 5;

interface ReportRailProps {
  report: CoachingReportDetail;
  isPro: boolean;
  voiceOpen: boolean;
  onToggleVoice: () => void;
}

/** Everything about the report rather than in it: potential, the actions, the sample, the rating. */
export function ReportRail({
  report,
  isPro,
  voiceOpen,
  onToggleVoice,
}: ReportRailProps): React.ReactElement {
  return (
    <div className="grid gap-3.5 lg:sticky lg:top-6">
      <section className={`${PANEL} bg-hero-fade px-4 py-4`}>
        <div className="hud-label text-[10.5px]">{"// Rank potential"}</div>
        <p className="my-2.5 font-display text-[26px] font-black uppercase tracking-[0.03em] text-accent">
          {report.estimatedRankPotential ?? "Not estimated"}
        </p>
        <div className="grid grid-cols-2 gap-4 border-t border-line-1 pt-3.5">
          <StatBlock label="Matches" value={String(report.matchesAnalyzed.length)} />
          {report.processingTimeMs !== null && (
            <StatBlock
              label="AI time"
              value={(report.processingTimeMs / 1000).toFixed(0)}
              unit="s"
            />
          )}
          {report.focusArea && <StatBlock label="Focus" value={report.focusArea} />}
        </div>
      </section>

      <section className={`${PANEL} grid gap-2.5 px-4 py-4`}>
        <div className="hud-label text-[10.5px]">{"// This report"}</div>
        {isPro && (
          <button type="button" onClick={onToggleVoice} className={ACTION}>
            <Mic aria-hidden className="h-3.5 w-3.5" />
            {voiceOpen ? "Close voice coach" : "Speak with voice coach"}
          </button>
        )}
        <a href={`/api/coaching/reports/${report.id}/pdf`} download className={ACTION}>
          <Download aria-hidden className="h-3.5 w-3.5" />
          Download PDF
        </a>
        <ShareReportButton reportId={report.id} />
      </section>

      {report.matchesAnalyzed.length > 0 && (
        <section className={`${PANEL} px-4 py-4`}>
          <div className="hud-label mb-3 text-[10.5px]">{"// Matches read"}</div>
          <div className="grid gap-2">
            {report.matchesAnalyzed.slice(0, MATCHES_SHOWN).map((matchId, i) => (
              <Link
                key={matchId}
                href={`/match/${matchId}`}
                className="flex items-center justify-between gap-3 font-mono text-[11.5px] text-text-body transition-colors hover:text-accent"
              >
                <span>Match {i + 1}</span>
                <span aria-hidden className="text-text-faint">
                  →
                </span>
              </Link>
            ))}
            {report.matchesAnalyzed.length > MATCHES_SHOWN && (
              <p className="font-mono text-[10px] uppercase tracking-label text-text-faint">
                +{report.matchesAnalyzed.length - MATCHES_SHOWN} more
              </p>
            )}
          </div>
        </section>
      )}

      <section className={`${PANEL} px-4 py-3.5`}>
        <ReportRating reportId={report.id} currentRating={report.userRating} />
      </section>
    </div>
  );
}
