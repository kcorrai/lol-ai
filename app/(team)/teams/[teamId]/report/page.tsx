"use client";

import { useParams } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamReportCard } from "@/domains/teams/components/TeamReportCard";
import { useTeamReport, useGenerateTeamReport } from "@/hooks/useTeamReport";
import { useTeams } from "@/hooks/useTeams";

export default function TeamReportPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const { data: teams } = useTeams();
  const myMembership = teams?.find((t) => t.id === teamId);
  const isCoach = myMembership?.myRole === "OWNER" || myMembership?.myRole === "COACH";

  const { data: report, isLoading } = useTeamReport(teamId);
  const { mutate: generate, isPending: isGenerating, error } = useGenerateTeamReport(teamId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <PageHeader
        title="AI Team Report"
        subtitle="Team strengths/weaknesses and coaching recommendations"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      )}

      {!isLoading && !report && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
          <Sparkles className="h-10 w-10 text-info/50" />
          <div>
            <p className="font-semibold text-text">No report generated yet</p>
            <p className="mt-1 text-sm text-text-muted">
              Analyzes the team&apos;s performance over the last 7 days and generates an AI coaching
              report.
            </p>
          </div>
          {isCoach && (
            <Button onClick={() => generate()} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? "Generating Report..." : "Generate Report"}
            </Button>
          )}
        </div>
      )}

      {error instanceof Error && (
        <p className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error.message}
        </p>
      )}

      {report && (
        <TeamReportCard
          report={report}
          onRegenerate={() => generate()}
          isRegenerating={isGenerating}
          isCoach={isCoach ?? false}
        />
      )}
    </div>
  );
}
