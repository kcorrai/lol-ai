"use client";

function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-2 ${className ?? ""}`} />;
}

export function OtpSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
        </span>
        AI OTP analizi hazırlanıyor...
      </div>

      {/* Meta rating */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-3 w-full" />
        <SkeletonBox className="h-8 w-full rounded-full" />
        <SkeletonBox className="h-3 w-3/4" />
      </div>

      {/* Tier list */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <SkeletonBox className="h-4 w-40" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonBox key={i} className="h-14" />
          ))}
        </div>
      </div>

      {/* Bans */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <SkeletonBox className="h-4 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} className="h-12" />
        ))}
      </div>

      {/* Power spikes */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <SkeletonBox className="h-4 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
