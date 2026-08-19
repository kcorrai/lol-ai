import Link from "next/link";
import { StartFreeCta } from "../StartFreeCta";
import { HudStagger, HudStaggerItem } from "./motion";

// These have to agree with /pricing, which reads the same numbers the app enforces
// (src/lib/auth/planLimits.ts:18-40, components/PricingContent.tsx:11-34). The strip
// previously advertised "2 reports per week · Last 20 games", neither of which was
// a limit the product has ever had.
const FREE_FEATURES = ["3 AI reports a month", "Last 10 games parsed", "Every free tool, no login"];
const PRO_FEATURES = [
  "Unlimited AI reports",
  "Last 100 games parsed",
  "Habit detection & climb roadmap",
  "Voice coaching",
];

function Price({ amount, per }: { amount: string; per?: string }): React.ReactElement {
  return (
    <p className="font-mono text-[32px] font-bold leading-none text-text">
      {amount}
      {per ? <span className="ml-1.5 text-[13px] text-text-muted">{per}</span> : null}
    </p>
  );
}

export function PricingStrip(): React.ReactElement {
  return (
    <section id="pricing" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <h2 className="mb-5 font-display text-2xl font-extrabold uppercase text-text md:text-[28px]">
          Pricing
        </h2>
        <HudStagger className="grid grid-cols-1 items-stretch gap-3.5 md:grid-cols-3">
          {/* Free */}
          <HudStaggerItem className="h-full">
            <div className="notch flex h-full flex-col gap-3 border border-border bg-surface p-5">
              <span className="hud-label">Free</span>
              <Price amount="$0" />
              <div className="grid gap-1.5 text-sm text-text-body">
                {FREE_FEATURES.map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
              <StartFreeCta className="tag-cut mt-auto flex h-10 items-center justify-center border border-line-2 font-display text-xs font-bold uppercase tracking-[0.1em] text-text transition-colors hover:border-line-3 hover:bg-surface-2" />
            </div>
          </HudStaggerItem>

          {/* Pro — the one rationed use of the accent in this section */}
          <HudStaggerItem className="h-full">
            <div className="notch glow-accent-soft flex h-full flex-col gap-3 border border-accent bg-surface p-5">
              <span className="font-mono text-[11px] uppercase tracking-label text-accent">
                Pro
              </span>
              <Price amount="$9.99" per="/mo" />
              <div className="grid gap-1.5 text-sm text-text-body">
                {PRO_FEATURES.map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
              <Link
                href="/pricing"
                className="tag-cut mt-auto flex h-10 items-center justify-center bg-accent font-display text-xs font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600"
              >
                Go Pro
              </Link>
            </div>
          </HudStaggerItem>

          {/* Team */}
          <HudStaggerItem className="h-full">
            <div className="notch flex h-full flex-col gap-3 border border-border bg-surface p-5">
              <span className="hud-label">Team</span>
              <Price amount="$29.99" per="/mo" />
              <p className="text-sm text-text-body">Five players, one coach dashboard.</p>
              <Link
                href="/pricing"
                className="mt-auto font-mono text-[11px] uppercase tracking-label text-accent"
              >
                Team details &rarr;
              </Link>
            </div>
          </HudStaggerItem>
        </HudStagger>
      </div>
    </section>
  );
}
