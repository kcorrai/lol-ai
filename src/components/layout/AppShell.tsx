"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { TiltAlertBanner } from "./TiltAlertBanner";
import { AchievementToast } from "@/components/achievements/AchievementToast";
import { GuidedOnboarding } from "@/domains/onboarding/guide/GuidedOnboarding";
import { OnboardingPreviewProvider } from "@/domains/onboarding/preview/OnboardingPreviewContext";
import { useUIStore } from "@/lib/stores/uiStore";

export function AppShell({
  children,
  onboardingComplete,
  userId,
}: {
  children: React.ReactNode;
  onboardingComplete: boolean;
  userId: string | null;
}) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);

  useEffect(() => {
    useUIStore.persist.rehydrate();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <TiltAlertBanner />
        <main
          className="flex-1 overflow-y-auto pb-16 md:pb-0"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "64px 64px" }}
        >
          <OnboardingPreviewProvider active={!onboardingComplete}>{children}</OnboardingPreviewProvider>
        </main>
      </div>
      <AchievementToast />
      <BottomNav />
      {!onboardingComplete && <GuidedOnboarding userId={userId} />}
    </div>
  );
}
