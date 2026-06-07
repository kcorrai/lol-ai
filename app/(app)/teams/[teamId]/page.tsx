"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamDashboard } from "@/domains/teams/components/TeamDashboard";
import type { TeamSummary } from "@/domains/teams/types/teams.types";

async function fetchMyTeams(): Promise<TeamSummary[]> {
  const res = await fetch("/api/teams");
  if (!res.ok) return [];
  const body = await res.json() as { data: TeamSummary[] };
  return body.data;
}

export default function TeamDashboardPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const { data: myTeams } = useQuery({
    queryKey: ["my-teams"],
    queryFn: fetchMyTeams,
  });

  const myMembership = myTeams?.find((t) => t.id === teamId);
  const isCoach =
    myMembership?.myRole === "OWNER" || myMembership?.myRole === "COACH";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <PageHeader
        title={myMembership?.name ?? "Takım Dashboardı"}
        subtitle="Takım üyeleri, son maçlar ve koçluk raporları"
      />
      <TeamDashboard teamId={teamId} isCoach={isCoach ?? false} />
    </div>
  );
}
