import Link from "next/link";

const TOOLS = [
  { href: "/draft", label: "Draft Room" },
  { href: "/tools/counter-picker", label: "Counter Picker" },
  { href: "/tools/matchup", label: "Matchup Analyzer" },
  { href: "/tools/draft-analyzer", label: "Draft Analyzer" },
  { href: "/tools/tier-list", label: "Tier List" },
  { href: "/builds", label: "Champion Builds" },
  { href: "/aram/tier-list", label: "ARAM Tier List" },
  { href: "/meta", label: "Patch Meta Report" },
];

// Cross-links between the free tools — improves internal linking / SEO and helps
// users hop between tools. Pass the current tool's href to omit it.
export function RelatedTools({ exclude }: { exclude?: string }) {
  const links = TOOLS.filter((t) => t.href !== exclude);
  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">
        Explore more free tools
      </h2>
      <div className="flex flex-wrap gap-2">
        {links.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition-colors hover:border-accent/40 hover:text-text"
          >
            {t.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
