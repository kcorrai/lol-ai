import type { Metadata } from "next";
import { PricingContent } from "../components/PricingContent";

export const metadata: Metadata = {
  title: "Pricing — LoL AI Coach",
  description: "Start free, upgrade when ready. Transparent pricing.",
};

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold text-text md:text-5xl">
            Pricing
          </h1>
          <p className="mt-4 text-lg text-text-muted">
            Start free. Upgrade when you&apos;re serious about climbing.
          </p>
        </div>

        <PricingContent />
      </div>
    </div>
  );
}
