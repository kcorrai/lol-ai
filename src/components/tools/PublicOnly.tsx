import { getSession } from "@/lib/auth/session";
import { isPublicVisitor } from "./publicVisitor";

// Wraps marketing-only content on the public Free Tools (the "no login required" eyebrow and
// the register CTA). Signed-in visitors see the tools inside the app shell (TASK-237), where a
// "sign up" pitch is noise — so this renders nothing for them and the full content for anonymous
// visitors, keeping the SEO/marketing path intact (TASK-238).
export async function PublicOnly({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!isPublicVisitor(session)) return null;
  return <>{children}</>;
}
