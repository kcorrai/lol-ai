import Link from "next/link";
import { SectionHead } from "./SectionHead";
import { HudStagger, HudStaggerItem } from "./motion";

/**
 * The ten screens an account opens that this page never named.
 *
 * All of them ship and all of them are in the signed-in sidebar; none of them appeared
 * anywhere on the landing page, so the product read as "a report and some free tools" to
 * everyone who had not signed up. That is the gap this band closes, and it closes it in one
 * screen rather than ten bands.
 *
 * Written from scratch rather than derived from `navConfig.ts`, under the same rule
 * `ArsenalPanels.tsx` states: the sidebar labels a screen for somebody who already uses it,
 * and this labels it for somebody deciding whether to. Neither list should move because the
 * other one did.
 *
 * No screenshots. `scripts/captureScreenshots.ts` needs a running app and a seeded database,
 * and ten stale JPEGs would sell an interface nobody gets.
 */

interface Feature {
  name: string;
  detail: string;
  href: string;
}

const FEATURES: readonly Feature[] = [
  {
    name: "Heat map",
    detail: "Where you die, drawn on the map. The shape of it is usually the habit.",
    href: "/analysis",
  },
  {
    name: "Match search",
    detail: "Your whole history, filtered by champion, role, queue, patch or who you queued with.",
    href: "/matches",
  },
  {
    name: "Career timeline",
    detail: "Every rank you have held and what changed around each move, on one line.",
    href: "/timeline",
  },
  {
    name: "Season recap",
    detail: "The year read back to you — and a link you can share without an account.",
    href: "/recap",
  },
  {
    name: "Milestone",
    detail: "What this month was worth, measured against the last one rather than a global mean.",
    href: "/milestone",
  },
  {
    name: "Rank roadmap",
    detail: "Name the rank you want; get the fourteen-day plan and the check-ins that grade it.",
    href: "/roadmap",
  },
  {
    name: "Improvement",
    detail: "Whether the thing you were told to fix is actually moving, game over game.",
    href: "/improvement",
  },
  {
    name: "OTP assistant",
    detail: "For the one-trick: every matchup your champion has, ranked by what it costs you.",
    href: "/otp",
  },
  {
    name: "Leaderboard",
    detail: "Where you sit against everyone else here, not against the whole server.",
    href: "/leaderboard",
  },
  {
    name: "Badges",
    detail: "What you have actually done — earned from your match history, not from logging in.",
    href: "/achievements",
  },
];

export function AccountBand(): React.ReactElement {
  return (
    <section id="account" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead
          title="Ten more screens behind the account"
          aside={
            <Link href="/register" className="text-accent">
              Start free &rarr;
            </Link>
          }
        />

        <HudStagger className="grid grid-cols-1 gap-px border border-border bg-line-1 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <HudStaggerItem key={f.href}>
              <Link
                href={f.href}
                className="group relative flex h-full flex-col bg-background p-5 transition-colors duration-[160ms] ease-out hover:bg-surface-2"
              >
                {/* One accent edge on hover — the system's signature for a live card.
                    Nothing scales: ADR-015 forbids growth on hover. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px bg-accent opacity-0 transition-opacity duration-[160ms] ease-out group-hover:opacity-100 motion-reduce:transition-none"
                />
                <p className="font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-text">
                  {f.name}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{f.detail}</p>
              </Link>
            </HudStaggerItem>
          ))}

          {/* Ten features and this card make eleven, which leaves a hole in the last row of a
              two- or three-column grid — and the `bg-line-1` ruling behind it reads as a
              twelfth, empty feature. Spanning two columns closes the row exactly at both
              widths. Not on mobile: a span of two in a one-column grid invents a second one. */}
          <div className="flex h-full flex-col justify-center bg-surface p-5 sm:col-span-2">
            <p className="font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-text">
              All of it on the free plan
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
              Three AI reports a month. The screens above are not the part we charge for.
            </p>
            <Link
              href="/pricing"
              className="mt-3 font-mono text-[11px] uppercase tracking-label text-accent"
            >
              What Pro adds &rarr;
            </Link>
          </div>
        </HudStagger>
      </div>
    </section>
  );
}
