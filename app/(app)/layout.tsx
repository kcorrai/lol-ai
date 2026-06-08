import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: {
    default: "LoL AI Coach",
    template: "%s | LoL AI Coach",
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppShell>{children}</AppShell>
    </QueryProvider>
  );
}
