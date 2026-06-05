"use client";

import { cn } from "@/lib/utils";
import type { OtpAnalysis } from "../types/otp.types";

interface MetaRatingProps {
  rating: OtpAnalysis["metaRating"];
}

function scoreColor(score: number): string {
  if (score >= 8) return "bg-green-500";
  if (score >= 5) return "bg-yellow-500";
  return "bg-red-500";
}

function scoreTextColor(score: number): string {
  if (score >= 8) return "text-green-400";
  if (score >= 5) return "text-yellow-400";
  return "text-red-400";
}

export function MetaRating({ rating }: MetaRatingProps) {
  const percent = (rating.score / 10) * 100;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Meta Rating</h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium",
              rating.score >= 8
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : rating.score >= 5
                  ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
            )}
          >
            {rating.assessment}
          </span>
          <span className={cn("text-xl font-bold", scoreTextColor(rating.score))}>
            {rating.score}/10
          </span>
        </div>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full transition-all duration-700", scoreColor(rating.score))}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-sm text-text-muted">{rating.reasoning}</p>
      <p className="text-xs text-text-muted/60">{rating.patchContext}</p>
    </div>
  );
}
