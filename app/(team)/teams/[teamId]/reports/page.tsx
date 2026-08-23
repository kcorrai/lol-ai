"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Loader2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTeamDashboard } from "@/hooks/useTeamDashboard";

const TIER_TR: Record<string, string> = {
  IRON: "Iron",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  EMERALD: "Emerald",
  DIAMOND: "Diamond",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
  CHALLENGER: "Challenger",
};

export default function TeamReportsPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { data, isLoading, error } = useTeamDashboard(teamId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="px-4 py-6 text-sm text-danger">
        {error instanceof Error ? error.message : "Failed to load"}
      </p>
    );
  }

  const { members } = data;
  const withReport = members.filter((m) => m.lastReportId);
  const withoutReport = members.filter((m) => !m.lastReportId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <PageHeader
        title="Coaching Reports"
        subtitle={`${withReport.length}/${members.length} members have reports`}
      />

      <div className="space-y-2">
        {withReport.map((m) => {
          const rankStr = m.rank
            ? `${TIER_TR[m.rank.tier] ?? m.rank.tier} ${m.rank.division} · ${m.rank.lp} LP`
            : "Unranked";

          return (
            <div
              key={m.userId}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {m.gameName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">
                  {m.gameName}
                  <span className="ml-1 text-xs font-normal text-text-muted">#{m.tagLine}</span>
                </p>
                <p className="text-xs text-text-muted">{rankStr}</p>
              </div>

              <Link
                href={`/coaching/${m.lastReportId}`}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
              >
                <FileText className="h-3.5 w-3.5" />
                View Report
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
            </div>
          );
        })}

        {withoutReport.map((m) => (
          <div
            key={m.userId}
            className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 opacity-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-text-muted">
              {m.gameName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text">
                {m.gameName}
                <span className="ml-1 text-xs font-normal text-text-muted">#{m.tagLine}</span>
              </p>
              <p className="text-xs text-text-muted/60">No report</p>
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-14 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-text-muted/30" />
            <p className="text-sm font-medium text-text-muted">No members yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
