interface SectionHeadProps {
  title: string;
  /** Right-hand mono note, or a link element. */
  aside?: React.ReactNode;
}

export function SectionHead({ title, aside }: SectionHeadProps): React.ReactElement {
  return (
    <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-4">
      <h2 className="font-display text-2xl font-extrabold uppercase text-text md:text-[28px]">
        {title}
      </h2>
      {aside ? <span className="hud-label">{aside}</span> : null}
    </div>
  );
}
