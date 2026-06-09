"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamActivityFeed } from "@/domains/teams/components/TeamActivityFeed";

export default function TeamActivityPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      <PageHeader
        title="Takım Aktivitesi"
        subtitle="Son üye hareketleri ve takım olayları"
      />
      <TeamActivityFeed teamId={teamId} />
    </div>
  );
}
