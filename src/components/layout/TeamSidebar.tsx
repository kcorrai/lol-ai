"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, LogOut, ChevronLeft, ChevronRight,
  ArrowLeft, Shield, Users, Loader2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";

function makeTeamNav(teamId: string) {
  return [
    { href: `/teams/${teamId}`,         icon: LayoutDashboard, label: "Dashboard",  exact: true  },
    { href: `/teams/${teamId}/members`, icon: Users,           label: "Üyeler",     exact: false },
  ] as const;
}

function NavItem({
  href, icon: Icon, label, collapsed, exact,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  exact: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center rounded-lg py-2 text-sm transition-all duration-150",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent font-semibold text-blue-400"
          : "text-text-muted hover:bg-white/5 hover:text-text"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1 h-[calc(100%-8px)] w-0.5 rounded-full bg-blue-400" />
      )}
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-blue-400" : "")} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

interface TeamSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function TeamSidebar({ collapsed, onToggle }: TeamSidebarProps) {
  const params = useParams();
  const teamId = params.teamId as string | undefined;
  const { user } = useAuth();
  const { data: teams, isLoading } = useTeams();
  const currentTeam = teams?.find((t) => t.id === teamId);
  const displayName = user?.name ?? user?.email ?? "Player";
  const teamNav = teamId ? makeTeamNav(teamId) : [];

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/5 transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-56"
      )}
      style={{ background: "linear-gradient(180deg, #08091280 0%, #07090F 100%)", backdropFilter: "blur(12px)" }}
    >
      {/* Header */}
      <div className={cn("flex h-14 items-center border-b border-white/5", collapsed ? "justify-center px-2" : "gap-2 px-4")}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 ring-1 ring-blue-500/30">
          <Shield className="h-4 w-4 text-blue-400" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
            ) : (
              <>
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-blue-400/70">Takım Modu</p>
                <p className="truncate text-sm font-bold text-text">{currentTeam?.name ?? "Takım"}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* Back to player mode */}
        <Link
          href="/dashboard"
          title={collapsed ? "Oyuncu Modu" : undefined}
          className={cn(
            "mb-1 flex items-center rounded-lg py-2 text-xs text-text-muted/60 transition-colors hover:bg-white/5 hover:text-text-muted",
            collapsed ? "justify-center px-2" : "gap-2 px-3"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Oyuncu Modu</span>}
        </Link>

        <div className="mb-2 border-t border-white/5" />

        {!collapsed && (
          <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted/40">
            Takım
          </p>
        )}

        {teamNav.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className={cn("border-t border-white/5 p-2", collapsed ? "flex justify-center" : "")}>
        <button
          onClick={onToggle}
          title={collapsed ? "Genişlet" : "Daralt"}
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
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Çıkış"
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
