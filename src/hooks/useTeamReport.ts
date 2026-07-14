import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { TeamReportData } from "@/domains/teams/services/teamReportService";

async function fetchTeamReport(teamId: string): Promise<TeamReportData | null> {
  const res = await fetch(`/api/teams/${teamId}/report`);
  if (!res.ok) return null;
  const body = (await res.json()) as { data: { report: TeamReportData | null } };
  return body.data.report;
}

async function generateReport(teamId: string): Promise<TeamReportData> {
  const res = await fetch(`/api/teams/${teamId}/report`, { method: "POST" });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? "Failed to generate report");
  }
  const body = (await res.json()) as { data: { report: TeamReportData } };
  return body.data.report;
}

export function useTeamReport(teamId: string) {
  const { status } = useSession();
  return useQuery<TeamReportData | null>({
    queryKey: ["team-report", teamId],
    queryFn: () => fetchTeamReport(teamId),
    enabled: status === "authenticated" && !!teamId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useGenerateTeamReport(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateReport(teamId),
    onSuccess: (report) => {
      queryClient.setQueryData(["team-report", teamId], report);
    },
  });
}
