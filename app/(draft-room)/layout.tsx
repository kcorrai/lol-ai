import { QueryProvider } from "@/components/providers/QueryProvider";

/**
 * The draft room gets the whole screen.
 *
 * It is not a page inside the product — it is a board two teams stare at for
 * twenty turns, and the sidebar, the marketing header and the page container
 * all cost it rows of champions. This group exists so the room can render
 * full-bleed while `/draft` itself keeps the tools chrome.
 *
 * The provider is mounted here for the same reason `(tools)` mounts one: the
 * room is login-free and every one of its hooks is a React Query hook, so the
 * anonymous branch cannot rely on the app shell for a client.
 */
export default function DraftRoomLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">{children}</div>
    </QueryProvider>
  );
}
