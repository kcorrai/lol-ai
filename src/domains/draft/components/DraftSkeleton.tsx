"use client";

function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-2 ${className ?? ""}`} />;
}

export function DraftSkeleton() {
  return (
    <div className="space-y-6">
      {/* Composition */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <SkeletonBox className="h-4 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox key={i} className="h-5 w-full" />
        ))}
      </div>
      {/* Win conditions */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <SkeletonBox className="h-4 w-36" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} className="h-16" />
          ))}
        </div>
      </div>
      {/* Scaling */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <SkeletonBox className="h-4 w-32" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBox key={i} className="h-20" />
          ))}
        </div>
      </div>
      {/* Verdict */}
      <SkeletonBox className="h-16 w-full rounded-xl" />
    </div>
  );
}
