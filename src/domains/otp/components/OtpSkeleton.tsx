"use client";

function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-2 ${className ?? ""}`} />;
}

export function OtpSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-warning" />
        </span>
        Preparing AI OTP analysis...
      </div>

      {/* Meta rating */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-3 w-full" />
        <SkeletonBox className="h-8 w-full rounded-full" />
        <SkeletonBox className="h-3 w-3/4" />
      </div>

      {/* Tier list */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <SkeletonBox className="h-4 w-40" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonBox key={i} className="h-14" />
          ))}
        </div>
      </div>

      {/* Bans */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <SkeletonBox className="h-4 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} className="h-12" />
        ))}
      </div>

      {/* Power spikes */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <SkeletonBox className="h-4 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
