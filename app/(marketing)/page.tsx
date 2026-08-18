import type { Metadata } from "next";
import { LandingHero } from "./components/laneiq/LandingHero";
import { DataStrip } from "./components/laneiq/DataStrip";
import { SampleReport } from "./components/laneiq/SampleReport";
import { ChampionPoolAudit } from "./components/laneiq/ChampionPoolAudit";
import { FreeToolsGrid } from "./components/laneiq/FreeToolsGrid";
import { DailyQuizStrip } from "./components/laneiq/DailyQuizStrip";
import { TierListPreview } from "./components/laneiq/TierListPreview";
import { HowItWorksStrip } from "./components/laneiq/HowItWorksStrip";
import { PricingStrip } from "./components/laneiq/PricingStrip";
import { ClosingSplash } from "./components/laneiq/ClosingSplash";
import { ProductDemo } from "./components/ProductDemo";
import { FeaturesSection } from "./components/FeaturesSection";
import { TeamPlanSection } from "./components/TeamPlanSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { Reveal } from "./components/Reveal";

export const metadata: Metadata = {
  title: "LoL AI Coach — Free LoL Tools & AI-Powered Coaching",
  description:
    "Paste your Riot ID and get the one habit costing you LP. Free League of Legends tools — counters, matchups, draft analysis and tier lists from real ranked data. No login required for the tools.",
  openGraph: {
    title: "LoL AI Coach — Free LoL Tools & AI-Powered Coaching",
    description:
      "Free LoL tools from real ranked data — counters, matchups, drafts, tier lists — plus AI coaching on your own games.",
    type: "website",
  },
};

export default function LandingPage(): React.ReactElement {
  return (
    <>
      <LandingHero />
      <DataStrip />
      <SampleReport />
      <ChampionPoolAudit />
      <FreeToolsGrid />
      <DailyQuizStrip />
      <TierListPreview />
      <HowItWorksStrip />

      {/* Sections carried over from the pre-rebrand page. The design had no
          counterpart for these, but they are the page's product explanation and
          social proof — the rebrand was visual, so they stay. */}
      <Reveal><ProductDemo /></Reveal>
      <Reveal><FeaturesSection /></Reveal>
      <Reveal><TeamPlanSection /></Reveal>
      <Reveal><TestimonialsSection /></Reveal>

      <PricingStrip />
      <ClosingSplash />
    </>
  );
}
