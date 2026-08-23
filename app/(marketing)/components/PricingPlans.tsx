"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PricingPlansProps {
  isAnnual: boolean;
  freeFeatures: string[];
  proFeatures: string[];
  proPrice: string;
  proUnit: string;
  proCta: string;
  proCtaHref: string;
  teamPrice: string;
}

function Bullet({ label, accent }: { label: string; accent?: boolean }): React.JSX.Element {
  return (
    <span className="grid grid-cols-[14px_1fr] items-start gap-2.5">
      <span className={`mt-[7px] h-1.5 w-1.5 ${accent ? "bg-acid-500" : "bg-ink-400"}`} />
      <span>{label}</span>
    </span>
  );
}

/**
 * Two consumer plans carry the weight; Team is one line.
 *
 * Three equal columns made the reader compare a plan for academies against a
 * plan for one player, which is not a decision anybody is actually making. The
 * choice on this page is Free or Pro; Team is a signpost for the few who need it.
 */
export function PricingPlans({
  isAnnual,
  freeFeatures,
  proFeatures,
  proPrice,
  proUnit,
  proCta,
  proCtaHref,
  teamPrice,
}: PricingPlansProps): React.JSX.Element {
  return (
    <>
      <section className="grid items-stretch gap-4 lg:grid-cols-[1fr_1.12fr]">
        <div className="notch flex flex-col border border-border bg-surface p-6">
          <span className="font-mono text-[10.5px] uppercase tracking-label text-fg-3">Free</span>
          <div className="mb-1.5 mt-2.5 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-bold leading-none text-fg-1">$0</span>
            <span className="font-mono text-xs text-fg-4">forever</span>
          </div>
          <p className="mb-5 mt-0 text-sm text-fg-2">
            Enough to find out whether the coach is right about you.
          </p>
          <div className="mb-5 grid gap-2.5 text-sm text-fg-2">
            {freeFeatures.map((f) => (
              <Bullet key={f} label={f} />
            ))}
          </div>
          <div className="mt-auto">
            <Link
              href="/register"
              className="notch-sm flex w-full items-center justify-center border border-line-2 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-fg-1 transition-colors hover:border-acid-500 hover:text-acid-500"
            >
              Start free
            </Link>
          </div>
        </div>

        <div className="notch glow-accent-soft relative flex flex-col overflow-hidden border border-acid-500">
          <span className="bg-hero-fade absolute inset-0 bg-surface" />
          <div className="relative flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10.5px] uppercase tracking-label text-acid-500">
                Pro
              </span>
              <span className="font-mono text-[9.5px] uppercase tracking-label text-fg-3">
                Cancel any time
              </span>
            </div>
            <div className="mb-1.5 mt-2.5 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold leading-none text-fg-1">
                {proPrice}
              </span>
              <span className="font-mono text-xs text-fg-4">{proUnit}</span>
            </div>
            <p className="mb-5 mt-0 max-w-[48ch] text-sm text-fg-2">
              Everything in Free, plus the parts that need to read all 100 of your games.
            </p>
            <div className="mb-5 grid gap-x-5 gap-y-2.5 text-sm text-fg-2 sm:grid-cols-2">
              {proFeatures.map((f) => (
                <Bullet key={f} label={f} accent />
              ))}
            </div>
            <div className="mt-auto">
              <Link
                href={proCtaHref}
                className="notch-sm btn-glow flex w-full items-center justify-center gap-2 bg-acid-500 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink-1000 transition-colors hover:bg-acid-400"
              >
                {proCta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {isAnnual && (
                <p className="mt-2.5 text-center font-mono text-[9.5px] uppercase tracking-wide text-fg-4">
                  Billed once a year
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="notch mt-3.5 flex flex-wrap items-center justify-between gap-5 border border-border bg-surface px-6 py-4">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="font-mono text-[10.5px] uppercase tracking-label text-fg-3">Team</span>
          <span className="font-mono text-xl font-bold text-fg-1">{teamPrice}</span>
          <span className="text-sm text-fg-2">
            Five teams of five, coach dashboard, weekly team report. For academies and clubs.
          </span>
        </div>
        <Link
          href="/teams"
          className="font-mono text-[10.5px] uppercase tracking-label text-acid-500 hover:text-acid-400"
        >
          Team details →
        </Link>
      </section>
    </>
  );
}
