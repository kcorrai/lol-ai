"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamDashboard } from "@/domains/teams/components/TeamDashboard";

export default function TeamMembersPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <PageHeader
        title="Üye Yönetimi"
        subtitle="Takım üyelerini görüntüleyin, davet edin veya çıkarın"
      />
      <TeamDashboard teamId={teamId} isCoach={true} />
    </div>
  );
}
