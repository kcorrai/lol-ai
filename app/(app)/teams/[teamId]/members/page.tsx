"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamDashboard } from "@/domains/teams/components/TeamDashboard";

export default function TeamMembersPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href={`/teams/${teamId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Üye Yönetimi"
          subtitle="Takım üyelerini görüntüleyin, davet edin veya çıkarın"
        />
      </div>
      <TeamDashboard teamId={teamId} isCoach={true} />
    </div>
  );
}
