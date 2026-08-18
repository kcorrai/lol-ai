import { cn } from "@/lib/utils";

interface MarketPageHeaderProps {
  title: string;
  /** Chips and mono facts on the line under the title. */
  meta?: React.ReactNode;
  /** One or two sentences, for pages that need to explain themselves. */
  lede?: React.ReactNode;
  /** Buttons and switches, parked at the baseline of the title on wide screens. */
  actions?: React.ReactNode;
  /** A crest or portrait to the left of the title. */
  aside?: React.ReactNode;
  className?: string;
}

/**
 * The lit band every page in the coaching section opens with.
 *
 * Shared so the ten pages cannot drift apart in type scale, and so the glow is
 * mixed once — it is a radial over the hero fade, not a flat tint, which is what
 * keeps the top of the page from reading as a second header bar.
 */
export function MarketPageHeader({
  title,
  meta,
  lede,
  actions,
  aside,
  className,
}: MarketPageHeaderProps): React.ReactElement {
  return (
    <section className={cn("relative overflow-hidden border-b border-line-1", className)}>
      <span
        className="bg-hero-fade absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(880px 320px at 15% 0%, rgba(198,255,61,0.10), transparent 70%), var(--bg-hero-fade)",
        }}
        aria-hidden
      />
      <span className="bg-scanline absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-x-7 gap-y-5 px-5 pb-6 pt-7 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          {aside}
          <div className="min-w-0">
            <h1 className="font-display text-[32px] font-black uppercase leading-[0.98] tracking-[0.02em] text-text md:text-[38px]">
              {title}
            </h1>
            {meta && <div className="mt-2.5 flex flex-wrap items-center gap-3">{meta}</div>}
            {lede && <p className="mt-3 max-w-[62ch] text-[14.5px] text-text-body">{lede}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-end gap-3">{actions}</div>}
      </div>
    </section>
  );
}
