"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function CounterPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <CounterCardSkeleton key={i} />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <CounterCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CounterCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-5 w-8 rounded" />
      </div>
    </div>
  );
}
