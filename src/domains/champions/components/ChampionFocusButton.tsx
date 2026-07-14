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
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    try {
      const { matchIds } = await apiFetch<{ matchIds: string[] }>(
        `/api/riot/${riotAccountId}/champion-matches?champion=${encodeURIComponent(championName)}`
      );

      if (matchIds.length === 0) {
        setError("Not enough ranked matches with this champion yet.");
        return;
      }

      generateReport.mutate(
        { riotAccountId, reportType: "champion_focus", matchIds, focusArea: championName },
        {
          onSuccess: () => setDone(true),
          onError: () => setError("Could not generate report, please try again."),
        }
      );
    } catch {
      setError("An error occurred, please try again.");
    }
  }

  if (done) {
    return (
      <button
        onClick={() => router.push("/coaching")}
        className="mt-2 w-full rounded-md bg-success/10 px-2 py-1.5 text-xs font-medium text-success hover:bg-success/20 transition-colors"
      >
        Report queued — view in reports →
      </button>
    );
  }

  return (
    <div className="mt-2">
      <Button
        size="sm"
        variant="secondary"
        className="w-full text-xs"
        onClick={handleClick}
        disabled={generateReport.isPending}
      >
        <Sparkles className="mr-1.5 h-3 w-3" />
        {generateReport.isPending ? "Generating…" : "AI Analysis"}
      </Button>
      {error && (
        <p className="mt-1 text-center text-[11px] text-danger">{error}</p>
      )}
    </div>
  );
}
