"use client";

import { cn } from "@/lib/utils";
import type { OtpAnalysis } from "../types/otp.types";

interface MetaRatingProps {
  rating: OtpAnalysis["metaRating"];
}

function scoreColor(score: number): string {
  if (score >= 8) return "bg-accent";
  if (score >= 5) return "bg-warning";
  return "bg-danger";
}

function scoreTextColor(score: number): string {
  if (score >= 8) return "text-accent";
  if (score >= 5) return "text-warning";
  return "text-danger";
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
                ? "border-accent/30 bg-accent/10 text-accent"
                : rating.score >= 5
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : "border-danger/30 bg-danger/10 text-danger"
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
