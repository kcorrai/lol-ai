"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, LogOut, ChevronLeft, ChevronRight,
  ArrowLeft, Shield, Users, Loader2, Sparkles, Settings, ChevronDown, Check, FileText, Activity,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";

function makeTeamNav(teamId: string) {
  return [
    { href: `/teams/${teamId}`,         icon: LayoutDashboard, label: "Dashboard",  exact: true  },
    { href: `/teams/${teamId}/members`, icon: Users,           label: "Members",     exact: false },
    { href: `/teams/${teamId}/report`,   icon: Sparkles,  label: "AI Report",     exact: false },
    { href: `/teams/${teamId}/reports`,  icon: FileText,  label: "Coach Reports", exact: false },
    { href: `/teams/${teamId}/activity`, icon: Activity,  label: "Activity",      exact: false },
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
  const router = useRouter();
  const teamId = params.teamId as string | undefined;
  const { user } = useAuth();
  const { data: teams, isLoading } = useTeams();
  const currentTeam = teams?.find((t) => t.id === teamId);
  const displayName = user?.name ?? user?.email ?? "Player";
  const isOwner = currentTeam?.myRole === "OWNER";
  const hasMultipleTeams = (teams?.length ?? 0) > 1;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const teamNav = teamId ? [
    ...makeTeamNav(teamId),
    ...(isOwner ? [{ href: `/teams/${teamId}/settings`, icon: Settings, label: "Settings", exact: false } as const] : []),
  ] : [];

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/5 transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-56"
      )}
      style={{ background: "linear-gradient(180deg, #08091280 0%, #07090F 100%)", backdropFilter: "blur(12px)" }}
    >
      {/* Header / team switcher */}
      <div
        ref={dropdownRef}
        className={cn("relative flex h-14 items-center border-b border-white/5", collapsed ? "justify-center px-2" : "gap-2 px-4")}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 ring-1 ring-blue-500/30">
          <Shield className="h-4 w-4 text-blue-400" />
        </div>
        {!collapsed && (
          <div
            className={cn("min-w-0 flex-1", hasMultipleTeams && "cursor-pointer")}
            onClick={() => hasMultipleTeams && setDropdownOpen((v) => !v)}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
            ) : (
              <div className="flex items-center gap-1">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-blue-400/70">Team Mode</p>
                  <p className="truncate text-sm font-bold text-text">{currentTeam?.name ?? "Team"}</p>
                </div>
                {hasMultipleTeams && (
                  <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-text-muted/50 transition-transform", dropdownOpen && "rotate-180")} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Team switcher dropdown */}
        {dropdownOpen && !collapsed && (
          <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-lg border border-white/10 bg-surface py-1 shadow-xl">
            {teams?.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setDropdownOpen(false);
                  router.push(`/teams/${t.id}`);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
              >
                <span className={cn("flex-1 truncate", t.id === teamId ? "font-semibold text-blue-400" : "text-text")}>
                  {t.name}
                </span>
                {t.id === teamId && <Check className="h-3.5 w-3.5 shrink-0 text-blue-400" />}
              </button>
            ))}
            <div className="mx-2 my-1 border-t border-white/5" />
            <Link
              href="/teams"
              onClick={() => setDropdownOpen(false)}
              className="flex w-full items-center px-3 py-2 text-xs text-text-muted hover:bg-white/5"
            >
              All Teams
            </Link>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <Link
          href="/dashboard"
          title={collapsed ? "Player Mode" : undefined}
          className={cn(
            "mb-1 flex items-center rounded-lg py-2 text-xs text-text-muted/60 transition-colors hover:bg-white/5 hover:text-text-muted",
            collapsed ? "justify-center px-2" : "gap-2 px-3"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Player Mode</span>}
        </Link>

        <div className="mb-2 border-t border-white/5" />

        {!collapsed && (
          <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted/40">
            Team
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
          title={collapsed ? "Expand" : "Collapse"}
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
