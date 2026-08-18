"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";

const QUEUES = [
  { href: "/admin/coaches", label: "Coaches" },
  { href: "/admin/disputes", label: "Disputes" },
];

// What a reviewer is supposed to weigh, in the order they should weigh it.
// Policy, not decoration: an inconsistent queue is how a marketplace's badge
// stops meaning anything.
const RULES = [
  "A rank we have not checked is not evidence. Decline rather than guess.",
  "Read the listing text as it was at time of booking, not as it is now.",
  "If the record does not show the promise being met, refund.",
  "Write the reason as if the person reading it will act on it — they will.",
];

interface Props {
  /** Tabs within the current queue — the statuses this page can show. */
  tabs: { key: string; label: string }[];
  active: string;
  onTab: (key: string) => void;
  /** Readouts for the masthead. Counted by the page, never estimated. */
  stats: { label: string; value: string; tone?: "default" | "accent" | "warn" | "loss" }[];
  count: number;
  children: React.ReactNode;
  /** Shown instead of the children when the queue has nothing in it. */
  empty?: string;
}

/**
 * The shell both review queues share.
 *
 * Coaches and disputes stay separate routes — the launch checklist points
 * people at `/admin/coaches` by name, and a queue somebody has bookmarked
 * should keep resolving. The switch between them is on the page instead, which
 * is what the design was really asking for.
 */
export function ReviewQueueShell({
  tabs,
  active,
  onTab,
  stats,
  count,
  children,
  empty,
}: Props): React.ReactElement {
  const pathname = usePathname();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[30px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[36px]">
            Review queue
          </h1>
          <p className="mt-3 max-w-[64ch] text-[15px] text-text-body">
            Coach applications and disputes. Every decision is made against a record both sides
            have been able to read the whole time.
          </p>
        </div>

        <div
          className="grid grid-cols-2 gap-px border border-border bg-line-1"
          style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-background px-4 py-3">
              <MarketStat label={stat.label} value={stat.value} tone={stat.tone} />
            </div>
          ))}
        </div>
      </div>

      <section className="notch mt-6 flex flex-wrap items-center gap-3.5 border border-border bg-surface p-4">
        <div className="flex gap-1.5">
          {QUEUES.map((queue) => (
            <Link
              key={queue.href}
              href={queue.href}
              className={cn(
                "tag-cut border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                pathname === queue.href
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line-2 text-text-muted hover:text-text"
              )}
            >
              {queue.label}
            </Link>
          ))}
        </div>

        <span className="h-5 w-px bg-line-1" aria-hidden />

        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTab(tab.key)}
              className={cn(
                "tag-cut shrink-0 border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-colors",
                tab.key === active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line-2 text-text-muted hover:text-text"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </section>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-3.5">
          {count === 0 && empty ? (
            <section className="notch border border-line-1 bg-surface px-7 py-14 text-center">
              <span
                className="notch-sm mb-4 inline-flex h-[50px] w-[50px] items-center justify-center border border-line-2 text-accent"
                aria-hidden
              >
                <CheckCheck className="h-[22px] w-[22px]" />
              </span>
              <p className="font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text">
                Queue is clear
              </p>
              <p className="mx-auto mt-3 max-w-[44ch] text-[14.5px] text-text-body">{empty}</p>
            </section>
          ) : (
            children
          )}
        </div>

        <div className="lg:sticky lg:top-6">
          <HudPanel label="How to decide">
            <ol className="grid gap-2.5">
              {RULES.map((rule, i) => (
                <li key={rule} className="grid grid-cols-[16px_1fr] items-start gap-2.5">
                  <span className="font-mono text-[9.5px] font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] text-text-body">{rule}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3.5 border-t border-line-1 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-warning">
              No provider connected — the ledger records what would have moved
            </p>
          </HudPanel>
        </div>
      </div>
    </>
  );
}
