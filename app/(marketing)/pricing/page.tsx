import type { Metadata } from "next";
import { PricingCard } from "../components/PricingCard";
import { PricingComparisonTable } from "../components/PricingComparisonTable";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing. Start free, upgrade when you're ready to go deeper.",
  openGraph: {
    title: "LoL AI Coach Pricing",
    description: "Simple, transparent pricing. Start free, upgrade when you're ready to go deeper.",
    type: "website",
  },
};

const FREE_FEATURES = [
  "3 AI coaching reports per month",
  "1 Riot account",
  "10-game match history",
  "Match deep dive",
  "Ranked progress tracking",
];

const PRO_FEATURES = [
  "Unlimited AI coaching reports",
  "3 Riot accounts",
  "100-game match history",
  "Match deep dive",
  "Ranked progress tracking",
  "Champion analytics",
  "Priority AI processing",
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-display text-4xl font-bold text-text md:text-5xl">
            Simple Pricing
          </h1>
          <p className="mt-4 text-lg text-text-muted">
            Start free. Upgrade when you&rsquo;re serious about climbing.
          </p>
        </div>

        {/* Cards */}
        <div className="mx-auto mb-20 grid max-w-3xl gap-6 md:grid-cols-2">
          <PricingCard
            plan="free"
            name="Free"
            price="$0"
            description="Everything you need to get started."
            features={FREE_FEATURES}
            cta="Get Started Free"
            ctaHref="/register"
          />
          <PricingCard
            plan="pro"
            name="Pro"
            price="$9.99"
            period="/month"
            description="For players serious about climbing."
            features={PRO_FEATURES}
            cta="Start Pro"
            ctaHref="/register"
            highlighted
          />
        </div>

        {/* Comparison table */}
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-text">
            Full Feature Comparison
          </h2>
          <PricingComparisonTable />
        </div>

        {/* FAQ note */}
        <p className="mt-10 text-center text-sm text-text-muted">
          All plans include unlimited match syncing and dashboard access.{" "}
          <span className="text-text">No hidden fees.</span>
        </p>
      </div>
    </div>
  );
}
