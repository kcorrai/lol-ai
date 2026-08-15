"use client";

import { XpLevelWidget } from "@/components/dashboard/XpLevelWidget";
import { DailyChallengeWidget } from "@/components/dashboard/DailyChallengeWidget";
import { ReferralWidget } from "@/domains/identity/components/ReferralWidget";

// Last thing on the page by rule — engagement must never outrank the improvement
// plan (ADR-015). A 1px grid gap draws the dividers so it reads as one strip.
export function EngagementStrip(): React.ReactElement {
  return (
    <section className="mt-1.5 grid grid-cols-1 gap-px border border-border bg-line-1 lg:grid-cols-3">
      <div className="bg-background p-4">
        <XpLevelWidget />
      </div>
      <div className="bg-background p-4">
        <DailyChallengeWidget />
      </div>
      <div className="bg-background p-4">
        <ReferralWidget />
      </div>
    </section>
  );
}
