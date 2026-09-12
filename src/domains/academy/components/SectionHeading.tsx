import Link from "next/link";

interface SectionHeadingProps {
  /** Rendered after the `//` marker, in HUD caps. */
  label: string;
  /** Optional plain caption on the right, when there is nothing to link to. */
  note?: string;
  /** Optional link on the right. Takes precedence over `note`. */
  action?: { href: string; label: string };
}

/**
 * The rule that separates one band of the Academy from the next: `// LABEL ———— action`.
 *
 * Every section on every Academy screen opens with one, which is what makes the pages read
 * as one instrument panel rather than a stack of unrelated cards.
 */
export function SectionHeading({ label, note, action }: SectionHeadingProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <span className="hud-label text-text-faint">
        {"// "}
        {label}
      </span>
      <span className="h-px flex-1 bg-line-1" />
      {action ? (
        <Link
          href={action.href}
          className="hud-label text-accent transition-colors hover:text-acid-400"
        >
          {action.label} →
        </Link>
      ) : (
        note && <span className="hud-label text-text-faint">{note}</span>
      )}
    </div>
  );
}
