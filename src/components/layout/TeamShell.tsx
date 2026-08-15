"use client";

import { useEffect } from "react";
import { TeamSidebar } from "./TeamSidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { AchievementToast } from "@/components/achievements/AchievementToast";
import { useUIStore } from "@/lib/stores/uiStore";

export function TeamShell({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);

  useEffect(() => {
    useUIStore.persist.rehydrate();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <TeamSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto pb-16 md:pb-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        >
          {children}
        </main>
      </div>
      <AchievementToast />
      <BottomNav />
    </div>
  );
}
