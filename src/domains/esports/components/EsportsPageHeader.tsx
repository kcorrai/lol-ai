interface EsportsPageHeaderProps {
  title: string;
  /** One or two sentences under the title. */
  lede?: React.ReactNode;
  /** A row of `StatBlock`s, parked at the baseline of the title on wide screens. */
  stats?: React.ReactNode;
}

/**
 * The masthead every esports index page opens with.
 *
 * Shared so the three of them cannot drift apart in type scale — the readouts on
 * the right are the only part that differs between them, and they are the part a
 * reader uses to tell the pages apart.
 */
export function EsportsPageHeader({
  title,
  lede,
  stats,
}: EsportsPageHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
      <div className="min-w-0">
        <h1 className="font-display text-[34px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[42px]">
          {title}
        </h1>
        {lede && <p className="mt-3 max-w-[56ch] text-[15px] text-text-body">{lede}</p>}
      </div>
      {stats && <div className="flex flex-wrap gap-x-8 gap-y-4 pb-1">{stats}</div>}
    </div>
  );
}
