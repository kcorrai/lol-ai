interface HudRuleProps {
  label: string;
  /** A link or control parked at the far right of the rule. */
  action?: React.ReactNode;
}

/**
 * A `// LABEL` tag with the rule that runs from it to the edge of the column.
 *
 * Used between panels rather than inside them: on a page whose slabs are all the
 * same grey, the rule is what tells a reader one group has ended.
 */
export function HudRule({ label, action }: HudRuleProps): React.ReactElement {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
        {`// ${label}`}
      </span>
      <span className="h-px flex-1 bg-line-1" aria-hidden />
      {action}
    </div>
  );
}
