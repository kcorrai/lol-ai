import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { goTo } from "@/lib/router";

/**
 * `next/link`, for the 192 website components this window renders (ADR-043).
 *
 * An `<a>` whose click is turned into a fragment change rather than a navigation. Letting
 * the anchor navigate for real would replace the whole webview document — losing the React
 * tree, the query cache, and the live game poll running behind it.
 */
interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string | { pathname: string; query?: Record<string, string> };
  children?: ReactNode;
  /** Accepted and ignored: prefetching means nothing without a Next server. */
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
}

function toPath(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  const query = new URLSearchParams(href.query ?? {}).toString();
  return query ? `${href.pathname}?${query}` : href.pathname;
}

export default function Link({
  href,
  children,
  replace,
  onClick,
  // Swallowed rather than spread: React warns about each of them on a DOM element, and a
  // console full of warnings is where a real one goes to hide.
  prefetch: _prefetch,
  scroll: _scroll,
  shallow: _shallow,
  ...rest
}: LinkProps): React.ReactElement {
  const path = toPath(href);

  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // A modifier click means "open somewhere else", and there is no somewhere else here.
    // Leaving it to the anchor would blank the window, so it is simply not a gesture this
    // app has.
    event.preventDefault();
    goTo(path, { replace });
  }

  return (
    // `href` is kept so the anchor is still a link to a screen reader and still shows its
    // target on hover; the click never uses it.
    <a href={`#${path}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
