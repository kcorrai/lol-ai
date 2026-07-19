import type { Metadata } from "next";
import Link from "next/link";
import { Swords, Users, Layers, Trophy, BookOpen, Snowflake, TrendingUp } from "lucide-react";
import { PublicOnly } from "@/components/tools/PublicOnly";

export const metadata: Metadata = {
  title: "Free LoL Tools — Counters, Matchups, Draft & Tier List | LoL AI Coach",
  description:
    "Free League of Legends tools, no login required: counter picker, matchup analyzer, draft analyzer and tier list — all powered by real ranked data, updated every patch.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  {
    href: "/tools/counter-picker",
    title: "Counter Picker",
    description: "Find the best champions to counter any pick, ranked by real win rate.",
    Icon: Swords,
  },
  {
    href: "/tools/matchup",
    title: "Matchup Analyzer",
    description: "Compare two champions head-to-head and see who wins the lane.",
    Icon: Users,
  },
  {
    href: "/tools/draft-analyzer",
    title: "Draft Analyzer",
    description: "Check any 5v5 comp's damage, frontline, scaling and lane matchups.",
    Icon: Layers,
  },
  {
    href: "/tools/tier-list",
    title: "Tier List",
    description: "The strongest champions per lane this patch, by win rate.",
    Icon: Trophy,
  },
  {
    href: "/builds",
    title: "Champion Builds",
    description: "Runes, items and skill order with the highest win rate for every champion.",
    Icon: BookOpen,
  },
  {
    href: "/aram/tier-list",
    title: "ARAM Tier List",
    description: "The best ARAM champions and builds this patch, by real win rate.",
    Icon: Snowflake,
  },
  {
    href: "/meta",
    title: "Patch Meta Report",
    description: "The biggest winners and losers of the current patch, updated automatically.",
    Icon: TrendingUp,
  },
];

export default function ToolsHubPage() {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LoL AI Coach Free Tools",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />

      <header className="mb-10 text-center">
        <PublicOnly>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            100% Free · No login required
          </p>
        </PublicOnly>
        <h1 className="font-display text-4xl font-black text-text md:text-5xl">Free LoL Tools</h1>
        <p className="mx-auto mt-3 max-w-2xl text-text-muted">
          Counter picks, matchups, drafts and tier lists — all powered by real ranked data and
          updated every patch. No account needed.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map(({ href, title, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-6 transition-all hover:border-accent/40 hover:bg-surface-2"
          >
            <span className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-accent">
              <Icon className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-display text-lg font-bold text-text group-hover:text-accent">
                {title}
              </span>
              <span className="mt-1 block text-sm text-text-muted">{description}</span>
            </span>
          </Link>
        ))}
      </div>

      <PublicOnly>
        <div className="mt-12 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
          <h2 className="font-display text-xl font-bold text-text">
            Want coaching on your own games?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">
            Connect your Riot account for a personal AI coaching report — your worst matchups,
            mistakes, and a plan to climb.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-block rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Get your free AI analysis
          </Link>
        </div>
      </PublicOnly>
    </div>
  );
}
