"use client";

import { useState } from "react";
import { PricingPlans } from "./PricingPlans";
import { PricingCompare } from "./PricingCompare";
import { PricingFaq } from "./PricingFaq";
import { PricingB2BSection } from "./PricingB2BSection";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "3 AI coaching reports per month",
  "1 Riot account, last 10 games",
  "Match detail analysis and rank tracking",
  "Counter picker, 3 counters per champion",
  "Every free tool, no login",
];

const PRO_FEATURES = [
  "Unlimited coaching reports",
  "3 Riot accounts",
  "Last 100 games parsed",
  "Matchup intelligence",
  "Champion mastery score",
  "Habit detection engine",
  "Improvement plan and history",
  "Shareable AI report cards",
  "Weekly development email",
  "Voice coaching",
];

const MONTHLY_PRICE = "$9.99";
const ANNUAL_TOTAL = "$99.90";
const ANNUAL_PER_MONTH = "$8.33";
const TEAM_MONTHLY = "$29.99/mo";
const TEAM_ANNUAL = "$299.90/yr";

export function PricingContent(): React.JSX.Element {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {[
            { annual: false, label: "Monthly" },
            { annual: true, label: "Annual" },
          ].map((option) => (
            <button
              key={option.label}
              onClick={() => setIsAnnual(option.annual)}
              className={cn(
                "tag-cut border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors",
                isAnnual === option.annual
                  ? "border-acid-500 bg-acid-500/10 text-acid-500"
                  : "border-line-2 text-fg-3 hover:text-fg-1"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {isAnnual && (
          <span className="tag-cut border border-acid-500 bg-acid-500/10 px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-label text-acid-500">
            2 months free
          </span>
        )}
      </div>

      <PricingPlans
        isAnnual={isAnnual}
        freeFeatures={FREE_FEATURES}
        proFeatures={PRO_FEATURES}
        proPrice={isAnnual ? ANNUAL_TOTAL : MONTHLY_PRICE}
        proUnit={isAnnual ? `/year · ${ANNUAL_PER_MONTH} a month` : "/month"}
        proCta={isAnnual ? `Go Pro — ${ANNUAL_TOTAL} a year` : `Go Pro — ${MONTHLY_PRICE} a month`}
        proCtaHref={isAnnual ? "/settings/billing?period=annual" : "/settings/billing"}
        teamPrice={isAnnual ? TEAM_ANNUAL : TEAM_MONTHLY}
      />

      <PricingCompare />
      <PricingB2BSection />
      <PricingFaq />
    </>
  );
}
