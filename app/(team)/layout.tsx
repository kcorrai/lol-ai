import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TeamShell } from "@/components/layout/TeamShell";

export const metadata: Metadata = {
  title: {
    default: "Team | LoL AI Coach",
    template: "%s | LoL AI Coach",
  },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <TeamShell>{children}</TeamShell>
    </QueryProvider>
  );
}
