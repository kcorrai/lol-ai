import { QueryProvider } from "@/components/providers/QueryProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar — implemented in TASK-012 */}
        <main className="flex-1">{children}</main>
      </div>
    </QueryProvider>
  );
}
