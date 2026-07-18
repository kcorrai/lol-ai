"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, Shield, TrendingUp, Gamepad2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavEntry {
  href: string;
  icon: LucideIcon;
  label: string;
  tourId?: string;
}

// All in-app routes — the old /counter entry 308-redirected into the public
// marketing-chrome tools and ejected the user from the app shell.
const NAV: NavEntry[] = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Home" },
  { href: "/coaching",      icon: TrendingUp,      label: "Reports", tourId: "nav-reports" },
  { href: "/coaching/chat", icon: MessageCircle,   label: "Coach Chat"  },
  { href: "/champion-pool", icon: Shield,          label: "Champions" },
  { href: "/settings/accounts", icon: Gamepad2,    label: "Accounts"  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-border bg-surface md:hidden">
      {NAV.map(({ href, icon: Icon, label, tourId }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            data-tour={tourId}
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
