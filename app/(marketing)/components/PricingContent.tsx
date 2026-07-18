"use client";

import { useState } from "react";
import { PricingCard } from "./PricingCard";
import { PricingComparisonTable } from "./PricingComparisonTable";
import { PricingB2BSection } from "./PricingB2BSection";

const FREE_FEATURES = [
  { label: "3 AI Coaching Reports per month" },
  { label: "1 Riot Account" },
  { label: "10-game History" },
  { label: "Match Detail Analysis" },
  { label: "Rank Tracking" },
  { label: "Counter Pick (3 counters)" },
  { label: "Draft Analyzer" },
];

const PRO_BASE_FEATURES = [
  { label: "Unlimited AI Coaching Reports" },
  { label: "3 Riot Accounts" },
  { label: "100-game History" },
  { label: "Counter Pick (full list)" },
  { label: "Priority AI Processing" },
];

const PRO_EXCLUSIVE_FEATURES = [
  { label: "Matchup Intelligence" },
  { label: "Champion Mastery Score" },
  { label: "Habit Detection Engine" },
  { label: "Progress Plan & History" },
  { label: "Shareable AI Report Cards" },
  { label: "Weekly AI Development Email" },
  { label: "Voice Coaching (TTS)" },
];

const TEAM_BASE_FEATURES = [
  { label: "All Pro features" },
  { label: "Create up to 5 teams" },
  { label: "5-person team (full roster)" },
];

const TEAM_EXCLUSIVE_FEATURES = [
  { label: "Team Performance Dashboard" },
  { label: "Coach / Player roles" },
  { label: "Email member invitations" },
  { label: "Bulk member analysis" },
];

const MONTHLY_PRICE = "$9.99";
const ANNUAL_PRICE_PER_MONTH = "$8.33";
const ANNUAL_TOTAL = "$99.90";
const TEAM_PRICE = "$29.99";

export function PricingContent() {
  const [isAnnual, setIsAnnual] = useState(false);

  const proPrice = isAnnual ? ANNUAL_PRICE_PER_MONTH : MONTHLY_PRICE;
  const proPeriod = isAnnual ? "/month (annual)" : "/month";
  const proCtaLabel = isAnnual
    ? `Start Pro — ${ANNUAL_TOTAL}/year`
    : `Start Pro — ${MONTHLY_PRICE}/month`;
  const proCtaHref = isAnnual
    ? `/settings/billing?period=annual`
    : `/settings/billing`;

  return (
    <>
      {/* Period toggle */}
      <div className="mb-12 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
              !isAnnual ? "bg-accent text-background" : "text-text-muted hover:text-text"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
              isAnnual ? "bg-accent text-background" : "text-text-muted hover:text-text"
            }`}
          >
            Annual
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isAnnual ? "bg-background/20 text-background" : "bg-success/15 text-success"
              }`}
            >
              2 months free
            </span>
          </button>
        </div>
        {isAnnual && (
          <p className="text-xs text-text-muted">
            With annual payment{" "}
            <span className="font-semibold text-success">total {ANNUAL_TOTAL}</span> — 17% cheaper than monthly.
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="mx-auto mb-20 grid max-w-5xl gap-8 md:grid-cols-3 md:items-start">
        <PricingCard
          plan="free"
          name="Free"
          price="$0"
          description="Everything you need to get started."
          features={FREE_FEATURES}
          cta="Start Free"
          ctaHref="/register"
        />
        <PricingCard
          plan="pro"
          name="Pro"
          price={proPrice}
          period={proPeriod}
          description="For those serious about climbing."
          features={PRO_BASE_FEATURES}
          proFeatures={PRO_EXCLUSIVE_FEATURES}
          cta={proCtaLabel}
          ctaHref={proCtaHref}
        />
        <PricingCard
          plan="team"
          name="Team"
          price={TEAM_PRICE}
          period="/month"
          description="Analyze your teams, coach your players."
          features={TEAM_BASE_FEATURES}
          proFeatures={TEAM_EXCLUSIVE_FEATURES}
          cta={`Start Team — ${TEAM_PRICE}/month`}
          ctaHref="/settings/billing"
        />
      </div>

      {/* Comparison table */}
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-text">
          Feature Comparison
        </h2>
        <PricingComparisonTable />
      </div>

      <p className="mt-10 text-center text-sm text-text-muted">
        All plans include unlimited match sync and dashboard access.{" "}
        <span className="text-text">No hidden fees.</span>
      </p>

      <PricingB2BSection />
    </>
  );
}
