import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TeamShell } from "@/components/layout/TeamShell";

export const metadata: Metadata = {
  title: {
    default: "Team | LaneIQ",
    template: "%s | LaneIQ",
  },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <TeamShell>{children}</TeamShell>
    </QueryProvider>
  );
}
