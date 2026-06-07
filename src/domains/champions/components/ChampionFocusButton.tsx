"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/fetcher";
import { useGenerateReport } from "@/hooks/useGenerateReport";

interface ChampionFocusButtonProps {
  riotAccountId: string;
  championName: string;
}

export function ChampionFocusButton({ riotAccountId, championName }: ChampionFocusButtonProps) {
  const router = useRouter();
  const generateReport = useGenerateReport();
  const [done, setDone] = useState(false);

  async function handleClick() {
    const { matchIds } = await apiFetch<{ matchIds: string[] }>(
      `/api/riot/${riotAccountId}/champion-matches?champion=${encodeURIComponent(championName)}`
    );

    if (matchIds.length === 0) return;

    generateReport.mutate(
      { riotAccountId, reportType: "champion_focus", matchIds, focusArea: championName },
      { onSuccess: () => setDone(true) }
    );
  }

  if (done) {
    return (
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-2 w-full rounded-md bg-success/10 px-2 py-1.5 text-xs font-medium text-success hover:bg-success/20 transition-colors"
      >
        Rapor kuyruğa alındı — dashboard&apos;da görüntüle →
      </button>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      className="mt-2 w-full text-xs"
      onClick={handleClick}
      disabled={generateReport.isPending}
    >
      <Sparkles className="mr-1.5 h-3 w-3" />
      {generateReport.isPending ? "Oluşturuluyor…" : "AI Analiz"}
    </Button>
  );
}
