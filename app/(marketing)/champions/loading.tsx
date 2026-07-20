import { Skeleton } from "@/components/ui/skeleton";

/** Covers `/champions` and `/champions/[name]`, both async server components. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-10 w-full max-w-sm" />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
        {Array.from({ length: 32 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
