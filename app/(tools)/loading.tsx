import { Skeleton } from "@/components/ui/skeleton";

/**
 * 13 of the 14 tool pages are async server components. On a meta-snapshot cache miss they await a
 * multi-second op.gg fetch, and only the ~50 most-picked champions are prerendered — so the pages
 * below this boundary really do block.
 *
 * Shaped like the tool pages (breadcrumb, heading, intro, then a table or card grid) so the layout
 * does not jump when the real content arrives.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Skeleton className="h-4 w-56" />

      <div className="space-y-2">
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20" />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
