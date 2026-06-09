"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamDashboard } from "@/domains/teams/components/TeamDashboard";
import { useTeams } from "@/hooks/useTeams";

export default function TeamDashboardPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { data: myTeams } = useTeams();
  const myMembership = myTeams?.find((t) => t.id === teamId);
  const isCoach = myMembership?.myRole === "OWNER" || myMembership?.myRole === "COACH";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <PageHeader
        title={myMembership?.name ?? "Takım Dashboard"}
        subtitle="Takım üyeleri, son maçlar ve koçluk raporları"
      />
      <TeamDashboard teamId={teamId} isCoach={isCoach ?? false} />
    </div>
  );
}
