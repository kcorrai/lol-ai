"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Gamepad2, LogOut, Zap, CreditCard, ChevronLeft, ChevronRight,
  UserCircle, Shield, MessageCircle, Target, Swords, Star, Users, ClipboardList,
  TrendingUp, Trophy, Map, Film, Lock, Bot, Sparkles, Medal, CalendarDays,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

const NAV_MAIN = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/champion-pool", icon: Shield,          label: "Şampiyonlar" },
  { href: "/coaching",      icon: ClipboardList,   label: "Raporlar" },
  { href: "/coaching/chat", icon: MessageCircle,   label: "Koç Chat" },
  { href: "/improvement",   icon: TrendingUp,      label: "Gelişim" },
  { href: "/achievements",  icon: Trophy,          label: "Rozetler" },
  { href: "/leaderboard",  icon: Medal,           label: "Lider Tablosu" },
  { href: "/milestone",    icon: CalendarDays,    label: "Milestone" },
  { href: "/analysis",      icon: Map,             label: "Isı Haritası" },
  { href: "/recap",         icon: Film,            label: "Sezon Recap" },
  { href: "/teams",         icon: Users,           label: "Takımlar" },
] as const;

const NAV_TOOLS = [
  { href: "/tools/counter-picker", icon: Target, label: "Counter Picker" },
  { href: "/tools/matchup",        icon: Swords, label: "Matchup Analyzer" },
  { href: "/otp",                  icon: Star,   label: "OTP Assistant" },
  { href: "/tools/draft-analyzer", icon: Users,  label: "Draft Analyzer" },
] as const;

const NAV_SETTINGS = [
  { href: "/settings/accounts", icon: Gamepad2,   label: "Hesaplar" },
  { href: "/settings/billing",  icon: CreditCard, label: "Fatura" },
  { href: "/settings/profile",  icon: UserCircle, label: "Profil" },
  { href: "/settings/privacy",  icon: Lock,       label: "Gizlilik" },
  { href: "/settings/discord",  icon: Bot,        label: "Discord" },
] as const;

function NavItem({
  href, icon: Icon, label, collapsed,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const allHrefs = [...NAV_MAIN, ...NAV_TOOLS, ...NAV_SETTINGS].map((n) => n.href);
  const active =
    pathname === href ||
    (pathname.startsWith(`${href}/`) &&
      !allHrefs.some((h) => h !== href && h.startsWith(`${href}/`) && pathname.startsWith(h)));

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center rounded-lg py-2 text-sm transition-all duration-150",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "bg-gradient-to-r from-accent/20 via-accent/10 to-transparent font-semibold text-accent"
          : "text-text-muted hover:bg-white/5 hover:text-text"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1 h-[calc(100%-8px)] w-0.5 rounded-full bg-accent animate-glow-pulse" />
      )}
      <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-accent" : "")} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-1 border-t border-white/5" />;
  return (
    <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted/40">
      {label}
    </p>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const isPro = subscription?.plan === "pro" || subscription?.plan === "elite" || subscription?.plan === "team";
  const displayName = user?.name ?? user?.email ?? "Player";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/5 transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-56"
      )}
      style={{ background: "linear-gradient(180deg, #08091280 0%, #07090F 100%)", backdropFilter: "blur(12px)" }}
    >
      {/* Brand */}
      <div className={cn("flex h-14 items-center border-b border-white/5", collapsed ? "justify-center px-2" : "gap-2 px-4")}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
          <Zap className="h-4 w-4 text-accent" />
        </div>
        {!collapsed && (
          <span className="font-display text-base font-bold tracking-wide text-text">LoL AI Coach</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <SectionLabel label="Oyna" collapsed={collapsed} />
        {NAV_MAIN.map((item) => <NavItem key={item.href} {...item} collapsed={collapsed} />)}
        <SectionLabel label="Araçlar" collapsed={collapsed} />
        {NAV_TOOLS.map((item) => <NavItem key={item.href} {...item} collapsed={collapsed} />)}
        <SectionLabel label="Ayarlar" collapsed={collapsed} />
        {NAV_SETTINGS.map((item) => <NavItem key={item.href} {...item} collapsed={collapsed} />)}
      </nav>

      {/* Pro upgrade banner */}
      {!isPro && !collapsed && (
        <div className="mx-2 mb-2 rounded-xl border border-accent/25 p-3" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.12) 0%, rgba(200,155,60,0.04) 100%)" }}>
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <p className="text-xs font-bold text-accent">Pro&apos;ya Yükselt</p>
          </div>
          <p className="mb-2 text-[11px] leading-relaxed text-text-muted">Sınırsız rapor, tüm araçlar ve öncelikli destek.</p>
          <Link
            href="/settings/billing"
            className="block w-full rounded-lg bg-accent/20 py-1.5 text-center text-[11px] font-bold text-accent transition-colors hover:bg-accent/30"
          >
            Pro&apos;ya Geç →
          </Link>
        </div>
      )}

      {/* Collapse toggle */}
      <div className={cn("border-t border-white/5 p-2", collapsed ? "flex justify-center" : "")}>
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center rounded-lg p-1.5 text-text-muted/50 transition-colors hover:bg-white/5 hover:text-text"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* User */}
      <div className={cn("border-t border-white/5 p-3", collapsed ? "flex justify-center" : "")}>
        {collapsed ? (
          <div title={displayName}><Avatar name={displayName} size="sm" /></div>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar name={displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-text">{displayName}</p>
              {user?.email && user.name && (
                <p className="truncate text-[11px] text-text-muted/60">{user.email}</p>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Log out"
              className="rounded p-1 text-text-muted/40 transition-colors hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
