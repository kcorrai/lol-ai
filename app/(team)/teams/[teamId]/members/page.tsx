"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamDashboard } from "@/domains/teams/components/TeamDashboard";
import { InviteLinkBox } from "@/domains/teams/components/InviteLinkBox";
import { useTeams } from "@/hooks/useTeams";

export default function TeamMembersPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { data: teams } = useTeams();
  const myRole = teams?.find((t) => t.id === teamId)?.myRole;
  const canInvite = myRole === "OWNER" || myRole === "COACH";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <PageHeader
        title="Üye Yönetimi"
        subtitle="Takım üyelerini görüntüleyin, davet edin veya çıkarın"
      />
      {canInvite && <InviteLinkBox teamId={teamId} />}
      <TeamDashboard teamId={teamId} isCoach={true} />
    </div>
  );
}
