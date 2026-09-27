"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { useRankedData } from "@/hooks/useRankedData";
import { coachesForReport } from "@/lib/coachMatch/matchQuiz";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

const PRIORITY = { high: 0, medium: 1, low: 2 } as const;

/**
 * The way from what the report found to a person who can fix it.
 *
 * The report says what is wrong; a coach is who works on it with you. The
 * link carries the top finding as the booking's opening line and asks for
 * coaches ranked above the player. Only Pro readers see the findings, so only
 * they get one carried — a free reader is not handed the gated text by URL.
 */
export function ReportCoachCard({
  report,
  isPro,
}: {
  report: CoachingReportDetail;
  isPro: boolean;
}): React.ReactElement {
  const { data: ranked } = useRankedData(report.riotAccountId);
  const top = isPro
    ? [...(report.weaknesses ?? [])].sort((a, b) => PRIORITY[a.priority] - PRIORITY[b.priority])[0]
    : undefined;
  const goal = top
    ? `My AI report says to work on ${top.area.toLowerCase()}: ${top.description}`
    : report.focusArea
      ? `I want to work on ${report.focusArea.toLowerCase()}.`
      : "";

  return (
    <section className="notch border border-accent/30 bg-surface px-4 py-4">
      <div className="hud-label flex items-center gap-2 text-[10.5px]">
        <GraduationCap className="h-3.5 w-3.5 text-accent" aria-hidden />
        {"// Work on this with a coach"}
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-text-body">
        {top
          ? `A human coach can take "${top.area}" apart with you, in your own games.`
          : "A human coach can work through this with you, in your own games."}
      </p>
      <Link
        href={coachesForReport(ranked?.rank?.tier ?? null, goal)}
        className="notch-sm mt-3 flex h-9 items-center justify-center border border-accent/50 bg-accent/10 font-mono text-[11px] uppercase tracking-label text-accent transition-colors hover:bg-accent/20"
      >
        Find a coach
      </Link>
      <p className="mt-2 text-[11px] text-text-faint">
        Coaches ranked above you, checked from their Riot accounts.
      </p>
    </section>
  );
}
