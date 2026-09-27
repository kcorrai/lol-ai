"use client";

import { ToolsAppChrome } from "@/components/layout/ToolsAppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
  /** The marketing header and footer, rendered on the server and handed in as finished markup. */
  header: React.ReactNode;
  footer: React.ReactNode;
  /** Section-specific styles for each shell — esports sets its sticky offset this way. */
  appStyle?: React.CSSProperties;
  marketingStyle?: React.CSSProperties;
}

/**
 * The chrome of the public sections members also reach from the sidebar — the Free Tools and
 * esports: the app shell for a signed-in visitor, the marketing chrome for everyone else
 * (TASK-237).
 *
 * Chosen here, in the browser, rather than in a layout on the server (ADR-059). Reading the
 * session on the server made every page under the layout dynamic — pages meant to be built once
 * and served from the CDN were rendered per request instead, and their `revalidate` did nothing.
 * The server now renders the marketing chrome for everybody, which is also what a crawler should
 * see, and a signed-in visitor's shell takes over once the session is known.
 *
 * One QueryProvider per branch: nesting a second under ToolsAppChrome's would mean two clients and
 * two caches on the same page (TASK-308).
 */
export function PublicChrome({
  children,
  header,
  footer,
  appStyle,
  marketingStyle,
}: Props): React.ReactElement {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <ToolsAppChrome>
        <div style={appStyle}>{children}</div>
      </ToolsAppChrome>
    );
  }

  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-background" style={marketingStyle}>
        {header}
        <main className="flex-1">{children}</main>
        {footer}
      </div>
    </QueryProvider>
  );
}
