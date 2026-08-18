import Link from "next/link";

/**
 * The one line back to the console from a page inside it.
 *
 * The coach pages are siblings in the nav, so nothing else says which of them
 * is the parent — and a coach who came in from a notification email has no
 * history to go back through.
 */
export function ConsoleBreadcrumb({ current }: { current: string }): React.ReactElement {
  return (
    <nav
      className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-faint"
      aria-label="Breadcrumb"
    >
      <Link href="/coach" className="text-text-muted hover:text-accent">
        Coach console
      </Link>{" "}
      / <span className="text-text-body">{current}</span>
    </nav>
  );
}
