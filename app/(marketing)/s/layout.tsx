import { QueryProvider } from "@/components/providers/QueryProvider";

/**
 * The summoner subtree, and only it, gets a React Query client.
 *
 * The marketing group has no provider, and the profile's "load more" is the first thing under it
 * to need a hook (CLAUDE.md §2.2 keeps fetching in hooks, not components). Mounting the provider
 * here rather than on the marketing layout keeps the client out of the landing page's bundle,
 * which is the page under an LCP budget — the same reasoning as the tools layout's split for
 * anonymous visitors (TASK-308).
 */
export default function SummonerLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <QueryProvider>{children}</QueryProvider>;
}
