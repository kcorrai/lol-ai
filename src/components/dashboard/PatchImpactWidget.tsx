"use client";

import { ExternalLink } from "lucide-react";
import { usePatchImpact } from "@/hooks/usePatchImpact";
import { formatGamePatch } from "@/lib/lolPatch";

interface Props {
  riotAccountId: string | null | undefined;
}

export function PatchImpactWidget({ riotAccountId }: Props) {
  const { data, isLoading } = usePatchImpact(riotAccountId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 animate-pulse space-y-2">
        <div className="h-3 w-32 rounded bg-border" />
        <div className="h-4 w-48 rounded bg-border" />
        <div className="space-y-1.5 pt-1">
          {[0, 1, 2].map(i => <div key={i} className="h-5 w-full rounded bg-border" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (!data.hasEnoughData) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Patch {formatGamePatch(data.currentVersion)} Impact
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Patch impact requires at least 5 matches with each champion to calculate.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Patch {formatGamePatch(data.currentVersion)} Impact
        </p>
        {data.patchNotesUrl && (
          <a
            href={data.patchNotesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-accent hover:underline"
          >
            Patch Notes <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      <div className="space-y-2">
        {data.champions.map(c => (
          <div key={c.championName} className="grid grid-cols-[1fr_2.5rem_1rem_2.5rem_3rem] items-center gap-x-2 text-sm">
            <span className="truncate font-medium text-text">{c.championName}</span>
            <span className="text-right text-xs text-text-muted">{c.beforeWr}%</span>
            <span className="text-center text-text-muted">→</span>
            <span className="text-right text-xs font-semibold text-text">{c.afterWr}%</span>
            <span
              className={`text-right text-xs font-bold ${
                c.wrDelta > 0 ? "text-success" : "text-danger"
              }`}
            >
              {c.wrDelta > 0 ? "+" : ""}{c.wrDelta}%
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-text-muted">
        Patch date: {new Date(data.patchDetectedAt).toLocaleDateString("en-US")}
      </p>
    </div>
  );
}
