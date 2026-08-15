"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Shield, Loader2, ChevronDown, Check } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";

// Team-mode header with a switcher dropdown. Self-contained so TeamSidebar stays
// focused on navigation layout.
export function TeamSwitcher({ collapsed }: { collapsed: boolean }) {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string | undefined;
  const { data: teams, isLoading } = useTeams();
  const currentTeam = teams?.find((t) => t.id === teamId);
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

  return (
    <div
      ref={dropdownRef}
      className={cn("relative flex h-14 items-center border-b border-white/5", collapsed ? "justify-center px-2" : "gap-2 px-4")}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-info/15 ring-1 ring-info/30">
        <Shield className="h-4 w-4 text-info" />
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
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-info/70">Team Mode</p>
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
              <span className={cn("flex-1 truncate", t.id === teamId ? "font-semibold text-info" : "text-text")}>
                {t.name}
              </span>
              {t.id === teamId && <Check className="h-3.5 w-3.5 shrink-0 text-info" />}
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
  );
}
