import type { Metadata } from "next";
import { LandingHero } from "./components/laneiq/LandingHero";
import { DataStrip } from "./components/laneiq/DataStrip";
import { HowItWorksStrip } from "./components/laneiq/HowItWorksStrip";
import { SampleReport } from "./components/laneiq/SampleReport";
import { ArsenalTabs } from "./components/laneiq/ArsenalTabs";
import { ProductShowcase } from "./components/laneiq/ProductShowcase";
import { ChampionPoolAudit } from "./components/laneiq/ChampionPoolAudit";
import { AcademyBand } from "./components/laneiq/AcademyBand";
import { FreeToolsGrid } from "./components/laneiq/FreeToolsGrid";
import { DailyQuizStrip } from "./components/laneiq/DailyQuizStrip";
import { TierListPreview } from "./components/laneiq/TierListPreview";
import { CoachingBand } from "./components/laneiq/CoachingBand";
import { ProvenanceStrip } from "./components/laneiq/ProvenanceStrip";
import { PricingStrip } from "./components/laneiq/PricingStrip";
import { ClosingSplash } from "./components/laneiq/ClosingSplash";

export const metadata: Metadata = {
  title: "LoL AI Coach — Free LoL Tools & AI-Powered Coaching",
  description:
    "Paste your Riot ID and get the one habit costing you LP. Free League of Legends tools — counters, matchups, draft analysis and tier lists from real ranked data. Plus a 61-lesson academy, a fearless draft room and live esports. No login required for the tools.",
  openGraph: {
    title: "LoL AI Coach — Free LoL Tools & AI-Powered Coaching",
    description:
      "Free LoL tools from real ranked data — counters, matchups, drafts, tier lists — plus AI coaching on your own games.",
    type: "website",
  },
};

/**
 * The page reads as an argument, in order: here is the ask, here is proof the
 * data is current, here is how it works, here is what you get, here is everything
 * else we are, and here is what it costs.
 *
 * `HowItWorksStrip` sits third rather than eighth. It used to come after the
 * sample report, which showed a first-time reader the payoff before telling them
 * what produced it.
 */
export default function LandingPage(): React.ReactElement {
  return (
    <>
      <LandingHero />
      <DataStrip />
      <HowItWorksStrip />
      <SampleReport />

      {/* The Academy, Draft Room, esports hub and streamer kit all ship, and none
          of them appeared anywhere on this page before. */}
      <ArsenalTabs />

      {/* The Arsenal panels draw the product; this shows it. Placed straight
          after them so the claim and the evidence sit together. */}
      <ProductShowcase />

      <ChampionPoolAudit />
      <AcademyBand />
      <FreeToolsGrid />
      <DailyQuizStrip />
      <TierListPreview />
      <CoachingBand />
      <ProvenanceStrip />
      <PricingStrip />
      <ClosingSplash />
    </>
  );
}
