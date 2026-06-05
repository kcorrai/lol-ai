"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Gamepad2,
  LogOut,
  Zap,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Shield,
  MessageCircle,
  Target,
  Swords,
  Star,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_MAIN = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/champions",     icon: Shield,          label: "Champions" },
  { href: "/coaching/chat", icon: MessageCircle,   label: "Coach Chat" },
] as const;

const NAV_TOOLS = [
  { href: "/counter", icon: Target, label: "Counter Pick" },
  { href: "/matchup", icon: Swords, label: "Matchup Koçu" },
  { href: "/otp",     icon: Star,   label: "OTP Asistanı" },
  { href: "/draft",   icon: Users,  label: "Draft Analizci" },
] as const;

const NAV_SETTINGS = [
  { href: "/settings/accounts", icon: Gamepad2,    label: "Accounts" },
  { href: "/settings/billing",  icon: CreditCard,  label: "Billing" },
  { href: "/settings/profile",  icon: UserCircle,  label: "Profile" },
] as const;

function NavItem({
  href,
  icon: Icon,
  label,
  collapsed,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center rounded-md py-2 text-sm transition-colors",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "bg-accent/10 font-medium text-accent"
          : "text-text-muted hover:bg-surface-2 hover:text-text"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1 h-[calc(100%-8px)] w-0.5 rounded-full bg-accent" />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-1 border-t border-border/50" />;
  return (
    <p className="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted/60">
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
  const displayName = user?.name ?? user?.email ?? "Player";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "gap-2 px-4"
        )}
      >
        <Zap className="h-5 w-5 shrink-0 text-accent" />
        {!collapsed && (
          <span className="font-display text-base font-bold text-text">LoL AI Coach</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <SectionLabel label="Play" collapsed={collapsed} />
        {NAV_MAIN.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}

        <SectionLabel label="Araçlar" collapsed={collapsed} />
        {NAV_TOOLS.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}

        <SectionLabel label="Settings" collapsed={collapsed} />
        {NAV_SETTINGS.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className={cn("border-t border-border p-2", collapsed ? "flex justify-center" : "")}>
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center rounded p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* User */}
      <div className={cn("border-t border-border p-3", collapsed ? "flex justify-center" : "")}>
        {collapsed ? (
          <div title={displayName}>
            <Avatar name={displayName} size="sm" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar name={displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text">{displayName}</p>
              {user?.email && user.name && (
                <p className="truncate text-xs text-text-muted">{user.email}</p>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Log out"
              className="rounded p-1 text-text-muted transition-colors hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
