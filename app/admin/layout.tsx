import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-6">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Admin</p>
          <nav className="flex items-center gap-4 text-xs text-text-muted">
            <Link href="/admin/analytics" className="hover:text-text">Analytics</Link>
            <Link href="/admin/coaches" className="hover:text-text">Coaches</Link>
            <Link href="/admin/ai-cost" className="hover:text-text">AI Cost</Link>
            <Link href="/admin/audit-logs" className="hover:text-text">Audit Logs</Link>
            <Link href="/admin/feature-flags" className="hover:text-text">Feature Flags</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
