import Link from "next/link";

interface ChipProps {
  href: string;
  active?: boolean;
  /** Set for filters that navigate within the same page's list of scopes. */
  ariaCurrent?: boolean;
  children: React.ReactNode;
}

/**
 * A scope or filter shortcut.
 *
 * One implementation for every chip row in the section: the league scopes, the
 * role filters and the region jumps are the same control doing the same job, and
 * a reader who learns the shape on one page should not have to relearn it on the
 * next.
 */
export function Chip({
  href,
  active = false,
  ariaCurrent = true,
  children,
}: ChipProps): React.ReactElement {
  return (
    <Link
      href={href}
      aria-current={active && ariaCurrent ? "page" : undefined}
      className={`tag-cut shrink-0 px-2.5 py-1 font-mono text-[11px] uppercase tracking-label transition-colors ${
        active
          ? "bg-accent text-background"
          : "bg-surface-2 text-text-body hover:bg-surface hover:text-text"
      }`}
    >
      {children}
    </Link>
  );
}
