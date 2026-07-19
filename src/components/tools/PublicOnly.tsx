"use client";

import { useSession } from "next-auth/react";
import { isPublicVisitor } from "./publicVisitor";

// Wraps marketing-only content on the public Free Tools (the "no login required" eyebrow and the
// register CTA). Signed-in visitors see the tools inside the app shell (TASK-237), where a
// "sign up" pitch is noise — so this renders nothing for them and the full content for anonymous
// visitors, keeping the SEO/marketing path intact (TASK-238).
//
// Gating happens client-side (not via a server session read) so the tool pages that are
// statically generated — e.g. /tools/tier-list/[role] with generateStaticParams — keep their
// SSG/ISR behaviour. The anonymous branch is what ends up in the prerendered HTML, so crawlers
// still see the marketing copy.
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  if (!isPublicVisitor(session)) return null;
  return <>{children}</>;
}
