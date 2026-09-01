import Link from "next/link";
import {
  getPopularChampions,
  getMetaSnapshot,
  formatGamePatch,
  ALL_POSITIONS,
  POSITION_LABELS,
  POSITION_SLUG,
} from "@/domains/meta";
import { DDRAGON_VERSION } from "@/lib/ddragon";
import { Wordmark } from "./laneiq/Wordmark";

interface FooterLink {
  href: string;
  label: string;
}

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }): React.ReactElement {
  return (
    <div>
      <p className="hud-label mb-2.5">{title}</p>
      <div className="grid gap-1.5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[13.5px] text-text-body transition-colors hover:text-text"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function MarketingFooter(): Promise<React.ReactElement> {
  const [popular, snapshot] = await Promise.all([getPopularChampions(5), getMetaSnapshot()]);

  const tierLists: FooterLink[] = [
    ...ALL_POSITIONS.map((pos) => ({
      href: `/tools/tier-list/${POSITION_SLUG[pos]}`,
      label: POSITION_LABELS[pos],
    })),
    { href: "/aram/tier-list", label: "ARAM" },
  ];

  const tools: FooterLink[] = [
    { href: "/quiz", label: "LaneIQ Daily" },
    { href: "/tools/counter-picker", label: "Counter picker" },
    { href: "/tools/draft-analyzer", label: "Draft analyzer" },
    { href: "/builds", label: "Builds" },
    { href: "/meta", label: "Meta report" },
    { href: "/tools/matchup", label: "Matchup analyzer" },
    { href: "/esports", label: "Esports" },
  ];

  const popularBuilds: FooterLink[] = popular.map((c) => ({
    href: `/builds/${c.key}`,
    label: c.name,
  }));

  // The parts of the product that are neither a tier list nor a legal page. The desktop app
  // in particular had no entry point anywhere on the marketing site before this.
  const product: FooterLink[] = [
    // First, because it is the product. It had no link anywhere on the marketing site —
    // not here, and on the bar only a menu entry that redirected to a login form.
    { href: "/coaching", label: "AI coach" },
    { href: "/download", label: "Desktop app" },
    { href: "/draft", label: "Draft room" },
    { href: "/academy", label: "Academy" },
    { href: "/tools/multi-search", label: "Multi-search" },
    { href: "/coaches", label: "Find a coach" },
  ];

  const company: FooterLink[] = [
    { href: "/pricing", label: "Pricing" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/login", label: "Log in" },
    { href: "/register", label: "Sign up" },
  ];

  return (
    <footer className="border-t border-border bg-surface-dark px-5 pb-8 pt-11 md:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-2 gap-7 md:grid-cols-3 lg:grid-cols-[1.2fr_repeat(5,1fr)]">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Wordmark size={16} />
          </div>
          <LinkColumn title="Product" links={product} />
          <LinkColumn title="Tier lists" links={tierLists} />
          <LinkColumn title="Tools" links={tools} />
          {popularBuilds.length > 0 && <LinkColumn title="Popular" links={popularBuilds} />}
          <LinkColumn title="Company" links={company} />
        </div>

        <div className="mt-8 flex flex-wrap justify-between gap-5 border-t border-border pt-[18px] font-mono text-[10.5px] uppercase tracking-[0.12em] text-text-faint">
          <span className="max-w-[78ch]">
            Not endorsed by Riot Games. League of Legends &copy; Riot Games, Inc.
          </span>
          <span>
            {snapshot ? `Patch ${formatGamePatch(snapshot.patch)} · ` : ""}
            Data Dragon {DDRAGON_VERSION}
          </span>
        </div>
      </div>
    </footer>
  );
}
