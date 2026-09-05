import { useMemo } from "react";
import { back, currentRoute, goTo, navigate, useRoute } from "@/lib/router";
import { routeParams } from "@/routes";

/**
 * `next/navigation`, for the 73 website components this window renders (ADR-043).
 *
 * Seven exports, which is every one the website imports: `useRouter`, `usePathname`,
 * `useSearchParams`, `useParams`, `notFound`, `redirect` and `permanentRedirect`. Each is
 * the fragment router underneath (`@/lib/router`), so a lifted component navigates the way
 * the native screens do and the back button keeps working across both.
 */

/**
 * Next's second argument. `scroll` is the only one the website passes, and there is nothing
 * to scroll here that the caller has not already decided — so it is accepted and ignored
 * rather than dropped from the signature, which would be a type error at 30 call sites.
 */
export interface NavigateOptions {
  scroll?: boolean;
}

export interface AppRouter {
  push: (href: string, options?: NavigateOptions) => void;
  replace: (href: string, options?: NavigateOptions) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string, options?: NavigateOptions) => void;
}

export function useRouter(): AppRouter {
  return useMemo(
    () => ({
      push: (href: string) => goTo(href),
      replace: (href: string) => goTo(href, { replace: true }),
      back,
      forward: () => window.history.forward(),
      // On the website this re-runs the server render. There is no server here, and the
      // data these screens show comes from React Query — which callers already invalidate
      // themselves. Doing nothing is honest; throwing would break a working screen.
      refresh: () => {},
      prefetch: () => {},
    }),
    []
  );
}

export function usePathname(): string {
  return useRoute().path;
}

export function useSearchParams(): URLSearchParams {
  const { search } = useRoute();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/**
 * The dynamic segments of the current route.
 *
 * Next reads these from the file-system route it matched. There is no such thing here, so
 * the route table records the segment names it captured and this reads them back — see
 * `routeParams` in `@/routes`.
 *
 * It used to be a module variable that the route table was supposed to write on each match
 * and nothing ever did, so this returned `{}` at every address. Nothing noticed, because
 * until the match detail screen was lifted no screen here read a parameter. Deriving it from
 * the address is what stops that being possible again: there is no write to forget.
 */
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const { path } = useRoute();
  return useMemo(() => routeParams(path) as T, [path]);
}

/**
 * Next unwinds to the nearest `not-found.tsx` by throwing. There is no boundary here to
 * catch it, so this sends the window to the screen it came from instead — a component that
 * calls this has decided it has nothing to show, and an empty window says less than the
 * page behind it.
 */
export function notFound(): never {
  navigate("/game", { replace: true });
  throw new Error("NEXT_NOT_FOUND");
}

export function redirect(href: string): never {
  goTo(href, { replace: true });
  throw new Error("NEXT_REDIRECT");
}

export const permanentRedirect = redirect;

export { currentRoute };
