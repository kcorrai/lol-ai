import type { Session } from "next-auth";

// The gate behind <PublicOnly>: marketing-only content shows for anonymous visitors and is
// hidden once someone is signed in (they see the tools inside the app shell). Kept as a pure,
// JSX-free helper so it's unit-testable without rendering a server component.
export function isPublicVisitor(session: Session | null): boolean {
  return !session?.user;
}
