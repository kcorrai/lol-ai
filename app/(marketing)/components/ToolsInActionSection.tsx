import Link from "next/link";
import Image from "next/image";

interface ToolShot {
  href: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

const TOOLS: ToolShot[] = [
  {
    href: "/tools/counter-picker",
    title: "Counter Picker",
    description:
      "See exactly who counters any champion — ranked by real win rate across millions of games this patch.",
    image: "/screenshots/counter-picker.jpeg",
    alt: "LoL AI Coach counter picker showing the best counters for Yasuo",
  },
  {
    href: "/tools/tier-list",
    title: "Tier List",
    description: "The strongest champions per lane every patch, with live win, pick and ban rates.",
    image: "/screenshots/tier-list.jpeg",
    alt: "LoL AI Coach tier list for the current patch",
  },
  {
    href: "/tools/draft-analyzer",
    title: "Draft Analyzer",
    description:
      "Build both team comps and get a stats-based read on damage, frontline, scaling and every lane matchup.",
    image: "/screenshots/draft-analyzer.jpeg",
    alt: "LoL AI Coach draft analyzer comparing two team compositions",
  },
];

export function ToolsInActionSection() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            Free · No login required
          </p>
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            Free Tools, Powered by Real Data
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-text-muted">
            Every tool runs on live ranked data and updates every patch. No account, no paywall.
          </p>
        </div>

        <div className="space-y-16">
          {TOOLS.map((tool, i) => (
            <div
              key={tool.href}
              className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <Link href={tool.href} className="group relative block">
                <div className="pointer-events-none absolute -inset-3 rounded-2xl bg-accent/5 blur-2xl transition-opacity group-hover:opacity-80" />
                <div className="relative overflow-hidden rounded-xl border border-border shadow-2xl transition-transform group-hover:-translate-y-1">
                  <Image
                    src={tool.image}
                    alt={tool.alt}
                    width={1280}
                    height={900}
                    className="w-full"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </Link>
              <div>
                <h3 className="font-display text-2xl font-bold text-text">{tool.title}</h3>
                <p className="mt-3 text-text-muted">{tool.description}</p>
                <Link
                  href={tool.href}
                  className="mt-5 inline-block rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  Open {tool.title} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
