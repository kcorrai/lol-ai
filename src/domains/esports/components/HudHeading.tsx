interface HudHeadingProps {
  children: React.ReactNode;
  /** A link or control parked at the far right of the rule. */
  action?: React.ReactNode;
  id?: string;
}

/**
 * A section title with the rule that runs from it to the edge of the column.
 *
 * The rule is what tells a reader where one panel's worth of content ends, on
 * pages whose sections are otherwise all the same dark grey.
 */
export function HudHeading({ children, action, id }: HudHeadingProps): React.ReactElement {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2
        id={id}
        className="font-display text-xl font-extrabold uppercase tracking-[0.03em] text-text md:text-[26px]"
      >
        {children}
      </h2>
      <span className="h-px flex-1 bg-line-1" aria-hidden />
      {action}
    </div>
  );
}
