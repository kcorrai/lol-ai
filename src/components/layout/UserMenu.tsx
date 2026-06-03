"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Settings, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = user?.name ?? user?.email ?? "Player";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={displayName}
        className="flex items-center rounded-md p-1 transition-colors hover:bg-surface-2"
      >
        <Avatar name={displayName} size="sm" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-xs font-medium text-text">{displayName}</p>
            {user?.email && (
              <p className="truncate text-xs text-text-muted">{user.email}</p>
            )}
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                router.push("/settings/accounts");
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm",
                "text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm",
                "text-text-muted transition-colors hover:bg-surface-2 hover:text-danger"
              )}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
