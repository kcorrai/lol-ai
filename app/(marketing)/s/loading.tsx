import { Skeleton } from "@/components/ui/skeleton";

/**
 * The public summoner page resolves a Riot ID against the live Riot API, so it is the slowest route
 * in the app and the one most worth a loading state.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
