import Link from "next/link";
import { Zap } from "lucide-react";
import { getPopularChampions, ALL_POSITIONS, POSITION_LABELS, POSITION_SLUG } from "@/domains/meta";

interface FooterLink {
  href: string;
  label: string;
}

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-text-muted transition-colors hover:text-text">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function MarketingFooter() {
  const popular = await getPopularChampions(6);

  const tierLists: FooterLink[] = [
    ...ALL_POSITIONS.map((pos) => ({
      href: `/tools/tier-list/${POSITION_SLUG[pos]}`,
      label: `${POSITION_LABELS[pos]} Tier List`,
    })),
    { href: "/aram/tier-list", label: "ARAM Tier List" },
  ];

  const tools: FooterLink[] = [
    { href: "/builds", label: "Champion Builds" },
    { href: "/tools/counter-picker", label: "Counter Picker" },
    { href: "/tools/matchup", label: "Matchup Analyzer" },
    { href: "/tools/draft-analyzer", label: "Draft Analyzer" },
    { href: "/meta", label: "Patch Meta Report" },
  ];

  const popularBuilds: FooterLink[] = popular.map((c) => ({
    href: `/builds/${c.key}`,
    label: `${c.name} Build`,
  }));

  const company: FooterLink[] = [
    { href: "/pricing", label: "Pricing" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/login", label: "Login" },
    { href: "/register", label: "Sign up" },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <LinkColumn title="Tier Lists" links={tierLists} />
          <LinkColumn title="Free Tools" links={tools} />
          {popularBuilds.length > 0 && <LinkColumn title="Popular This Patch" links={popularBuilds} />}
          <LinkColumn title="Company" links={company} />
        </div>

        <div className="mt-10 flex items-center gap-2 border-t border-border pt-6">
          <Zap className="h-4 w-4 text-accent" />
          <span className="font-display text-sm font-bold text-text">LoL AI Coach</span>
        </div>

        <div className="mt-4 text-center md:text-left">
          <p className="text-xs text-text-muted">
            LoL AI Coach isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
            opinions of Riot Games or anyone officially involved in producing or managing Riot Games
            properties. League of Legends &copy; Riot Games, Inc.
          </p>
          <p className="mt-2 text-xs text-text-muted">© {new Date().getFullYear()} LoL AI Coach</p>
        </div>
      </div>
    </footer>
  );
}
