import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface BuildRailProps {
  name: string;
  championKey: string;
  rawPatch: string;
  gamePatch: string;
  hoursAgo: number;
  matchCount?: number;
  /** The plain-language summary already written for this build. */
  reasoning: string;
  isAram: boolean;
}

const PANEL = "notch border border-border bg-surface";
const HEAD =
  "border-b border-line-1 px-4 py-3 font-mono text-[10.5px] uppercase tracking-label text-text-muted";

/** The side rail: the short version, where the numbers came from, and where to go next. */
export function BuildRail({
  name,
  championKey,
  rawPatch,
  gamePatch,
  hoursAgo,
  matchCount,
  reasoning,
  isAram,
}: BuildRailProps): React.ReactElement {
  const related = isAram
    ? [
        { label: `${name} ranked build`, href: `/builds/${championKey}` },
        { label: "ARAM tier list", href: "/aram/tier-list" },
        { label: `${name} counters`, href: `/counters/${championKey}` },
        { label: `${name} champion guide`, href: `/champions/${championKey}` },
      ]
    : [
        { label: `${name} ARAM build`, href: `/aram/${championKey}` },
        { label: `${name} counters`, href: `/counters/${championKey}` },
        { label: "Tier list", href: "/tools/tier-list" },
        { label: `${name} champion guide`, href: `/champions/${championKey}` },
      ];

  return (
    <div className="grid gap-3.5 lg:sticky lg:top-6">
      <section className={`${PANEL} bg-hero-fade px-4 py-4`}>
        <div className="hud-label mb-3 text-[10.5px]">{"// The short version"}</div>
        <p className="text-[13.5px] leading-relaxed text-text-body">{reasoning}</p>
      </section>

      <section className={`${PANEL} px-4 py-4`}>
        <div className="hud-label mb-3 text-[10.5px]">{"// Sample"}</div>
        <dl className="grid gap-2.5 text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-text-body">Games analyzed</dt>
            <dd className="font-mono text-text">
              {matchCount ? matchCount.toLocaleString() : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-body">Rank band</dt>
            <dd className="font-mono uppercase text-text">{isAram ? "All" : "Emerald+"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-body">Patch</dt>
            <dd className="font-mono text-text">{gamePatch}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-body">Data Dragon</dt>
            <dd className="font-mono text-text">{rawPatch}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-body">Updated</dt>
            <dd className="font-mono text-text">{hoursAgo}h ago</dd>
          </div>
        </dl>
      </section>

      <section className={PANEL}>
        <div className={HEAD}>{`// Also for ${name}`}</div>
        {related.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-3 border-b border-line-1 px-4 py-3 text-[13.5px] text-text-body transition-colors last:border-b-0 hover:text-accent"
          >
            <span>{item.label}</span>
            <span aria-hidden className="font-mono text-text-faint">
              →
            </span>
          </Link>
        ))}
      </section>

      <section className="notch glow-accent-soft border border-accent bg-surface px-4 py-4">
        <p className="font-display text-[15px] font-extrabold uppercase leading-tight tracking-[0.03em] text-text">
          This is the average {name}. You are not average.
        </p>
        <p className="mt-2.5 text-[13px] text-text-body">
          Connect your account and the build adjusts to your own matchups and death timings.
        </p>
        <Link
          href="/register"
          className="notch-sm mt-3.5 flex h-[34px] items-center justify-center gap-1.5 bg-accent font-mono text-[11px] font-bold uppercase tracking-label text-background transition-opacity hover:opacity-90"
        >
          Analyze my {name} games
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}
