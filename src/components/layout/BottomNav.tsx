"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, Target, TrendingUp, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Ana Sayfa" },
  { href: "/counter",           icon: Target,          label: "Counter" },
  { href: "/improvement",       icon: TrendingUp,      label: "Gelişim" },
  { href: "/coaching/chat",     icon: MessageCircle,   label: "Koç Chat" },
  { href: "/settings/accounts", icon: Gamepad2,        label: "Hesaplar" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-border bg-surface md:hidden">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
              active ? "text-accent" : "text-text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
