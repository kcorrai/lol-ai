"use client";

import { useEffect } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { useUIStore } from "@/lib/stores/uiStore";

// A slim app shell for signed-in visitors to the Free Tools (TASK-237). It reuses the real
// Sidebar/TopBar so the tools no longer eject the user out of the app, but deliberately drops
// the forced-onboarding overlay and tilt banner — tool pages aren't part of the guided journey.
export function ToolsAppChrome({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);

  useEffect(() => {
    useUIStore.persist.rehydrate();
  }, []);

  return (
    <QueryProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main
            className="flex-1 overflow-y-auto pb-16 md:pb-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          >
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </QueryProvider>
  );
}
