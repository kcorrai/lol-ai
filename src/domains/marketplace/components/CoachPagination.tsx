import Link from "next/link";

interface Props {
  page: number;
  hasNext: boolean;
  /** The canonical path for this search with no page on it — `/coaches` or `/coaches?role=…`. */
  basePath: string;
}

/**
 * Page links, not an infinite scroll.
 *
 * A server component with real `<a href>`s on purpose: this is the public,
 * indexable surface, and a crawler that cannot follow a link cannot see page
 * two. Infinite scroll would hide every coach past the first screen from search
 * entirely.
 */
export function CoachPagination({ page, hasNext, basePath }: Props): React.ReactElement | null {
  if (page === 1 && !hasNext) return null;

  const join = basePath.includes("?") ? "&" : "?";
  const href = (n: number) => (n === 1 ? basePath : `${basePath}${join}page=${n}`);

  return (
    <nav
      className="mt-5 flex items-center justify-between gap-3 border-t border-line-1 pt-5"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="tag-cut border border-line-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
        Page {page}
      </span>

      {hasNext ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className="tag-cut border border-line-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
