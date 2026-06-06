"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function CounterPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
        </span>
        AI counter verileri hazırlanıyor...
      </div>

      {/* Hero skeleton */}
      <Skeleton className="h-48 w-full rounded-2xl" />

      {/* List sections */}
      {[5, 3, 3].map((count, s) => (
        <div key={s}>
          <Skeleton className="mb-3 h-4 w-40" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: Math.min(count, 2) }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-5 w-10" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
