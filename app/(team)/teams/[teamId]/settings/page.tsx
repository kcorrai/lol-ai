"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamSettingsForm } from "@/domains/teams/components/TeamSettingsForm";
import { DangerZone } from "@/domains/teams/components/DangerZone";
import { useTeams } from "@/hooks/useTeams";

export default function TeamSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const { data: teams, isLoading } = useTeams();
  const team = teams?.find((t) => t.id === teamId);
  const isOwner = team?.myRole === "OWNER";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!isOwner) {
    router.replace(`/teams/${teamId}`);
    return null;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <PageHeader
        title="Team Settings"
        subtitle="Edit team information or delete your team"
      />
      {team && (
        <>
          <TeamSettingsForm teamId={teamId} initialName={team.name} />
          <DangerZone teamId={teamId} teamName={team.name} />
        </>
      )}
    </div>
  );
}
