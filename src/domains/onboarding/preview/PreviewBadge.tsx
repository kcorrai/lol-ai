"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Marks illustrative onboarding preview content so a brand-new user never mistakes the sample
// data for their own stats (TASK-219).
export function PreviewBadge({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent",
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      Preview · Sample data
    </span>
  );
}
