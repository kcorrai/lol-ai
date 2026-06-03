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
        <p className="text-xs font-bold uppercase tracking-widest text-accent">
          Admin
        </p>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
