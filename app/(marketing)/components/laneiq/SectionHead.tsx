interface SectionHeadProps {
  title: string;
  /** Right-hand mono note, or a link element. */
  aside?: React.ReactNode;
  /** One line under the title, for a section whose heading alone does not carry the claim. */
  note?: string;
}

/**
 * The `order` classes exist for the wrapped case. With all three on one flex line the aside
 * lands between the title and the note on a narrow screen, which reads as the link belonging
 * to the sentence under it. Below `md` the note takes its own line first and the link follows.
 */
export function SectionHead({ title, aside, note }: SectionHeadProps): React.ReactElement {
  return (
    <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h2 className="order-1 font-display text-2xl font-extrabold uppercase text-text md:text-[28px]">
        {title}
      </h2>
      {aside ? <span className="hud-label order-3 md:order-2">{aside}</span> : null}
      {note ? (
        // `basis-full` and no max-width. `w-full` lets a flex item shrink back onto the
        // title's line, and a `max-w` clamps the basis the wrap is calculated from, which
        // does the same thing — either one puts the sentence beside the heading.
        <p className="order-2 basis-full text-sm text-text-body md:order-3">{note}</p>
      ) : null}
    </div>
  );
}
