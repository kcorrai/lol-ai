import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { listDisputes, pendingCount } from "@/domains/marketplace";

const NAV = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/coaches", label: "Coaches" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/ai-cost", label: "AI cost" },
  { href: "/admin/audit-logs", label: "Audit logs" },
  { href: "/admin/feature-flags", label: "Feature flags" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    redirect("/dashboard");
  }

  // The one number an admin needs before choosing a page. A queue nobody
  // watches is the complaint that killed the competitors, so it is in the
  // chrome rather than behind a click.
  const [applications, disputes] = await Promise.all([pendingCount(), listDisputes("OPEN")]);
  const waiting = applications + disputes.length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line-1 bg-[var(--surface-glass)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-5 px-5 md:px-8">
          <span className="shrink-0 font-display text-[15px] font-extrabold uppercase tracking-[0.14em] text-accent">
            Admin
          </span>

          <nav className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted transition-colors hover:text-text"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <span
            className={`ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] ${
              waiting > 0 ? "text-warning" : "text-text-faint"
            }`}
          >
            {waiting > 0 && <span className="h-1.5 w-1.5 animate-pulse bg-warning" aria-hidden />}
            {waiting} waiting
          </span>
        </div>
      </header>
      {/*
        `admin/` sits outside the `(app)` route group, so it never inherited a
        QueryClient and any admin page using a hook from `src/hooks/` threw on
        render. The pages written before this one reach for `fetch` in a
        `useEffect` instead, which is what CLAUDE.md's "data fetching goes
        through React Query hooks" exists to prevent. Providing the client here
        is inert for those pages and lets new ones follow the rule.
      */}
      <QueryProvider>
        <main className="mx-auto max-w-[1240px] px-5 py-7 md:px-8">{children}</main>
      </QueryProvider>
    </div>
  );
}
