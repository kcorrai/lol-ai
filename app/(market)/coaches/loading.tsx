import { Skeleton } from "@/components/ui/skeleton";

/**
 * The storefront is `force-dynamic` — the filter space is combinatorial, so caching it would
 * mostly cache misses — and it awaits two database queries before it renders anything, the
 * hero's totals among them. With no boundary here, clicking "Coaches" in the nav left the
 * previous page sitting there with nothing to say a navigation had started, and a cold direct
 * load showed nothing at all until the queries came back.
 *
 * Shaped like the page it stands in for — hero, three stat tiles, filter bar, then a three-up
 * card grid — so the layout does not jump when the real thing arrives.
 */
export default function Loading() {
  return (
    <>
      <section className="border-b border-line-1">
        <div className="mx-auto grid max-w-[1240px] items-end gap-8 px-5 pb-8 pt-10 md:px-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <Skeleton className="mb-3.5 h-3 w-64" />
            <Skeleton className="h-[38px] w-full max-w-[20ch] md:h-[50px]" />
            <Skeleton className="mt-3 h-[38px] w-3/4 max-w-[16ch] md:h-[50px]" />
            <Skeleton className="mt-4 h-4 w-full max-w-[60ch]" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-[44ch]" />
          </div>

          <div className="grid grid-cols-3 gap-px border border-border bg-line-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-background p-3.5">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="mt-2 h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 md:px-8">
        <Skeleton className="h-40 w-full" />

        <div className="mt-4 grid items-start gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
