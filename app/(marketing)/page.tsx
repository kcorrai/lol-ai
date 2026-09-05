import type { Metadata } from "next";
import { LandingHero } from "./components/laneiq/LandingHero";
import { DataStrip } from "./components/laneiq/DataStrip";
import { HowItWorksStrip } from "./components/laneiq/HowItWorksStrip";
import { SampleReport } from "./components/laneiq/SampleReport";
import { ArsenalTabs } from "./components/laneiq/ArsenalTabs";
import { ProductShowcase } from "./components/laneiq/ProductShowcase";
import { DesktopBand } from "./components/laneiq/DesktopBand";
import { ChampionPoolAudit } from "./components/laneiq/ChampionPoolAudit";
import { AccountBand } from "./components/laneiq/AccountBand";
import { AcademyBand } from "./components/laneiq/AcademyBand";
import { FreeToolsGrid } from "./components/laneiq/FreeToolsGrid";
import { DailyQuizStrip } from "./components/laneiq/DailyQuizStrip";
import { TierListPreview } from "./components/laneiq/TierListPreview";
import { CoachingBand } from "./components/laneiq/CoachingBand";
import { ProvenanceStrip } from "./components/laneiq/ProvenanceStrip";
import { PricingStrip } from "./components/laneiq/PricingStrip";
import { ClosingSplash } from "./components/laneiq/ClosingSplash";

export const metadata: Metadata = {
  title: { absolute: "LoL AI Coach — Free LoL Tools, AI Coaching & Real Coaches" },
  description:
    "Paste your Riot ID and get the one habit costing you LP — or book a human coach whose rank we read from their own Riot account. Free League of Legends tools: counters, matchups, draft analysis and tier lists from real ranked data. Plus a 61-lesson academy, a fearless draft room and live esports. No login required for the tools.",
  openGraph: {
    title: "LoL AI Coach — Free LoL Tools, AI Coaching & Real Coaches",
    description:
      "Free LoL tools from real ranked data — counters, matchups, drafts, tier lists — plus AI coaching on your own games and human coaches whose rank we checked.",
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
 *
 * `CoachingBand` sits fifth rather than fourteenth. Coaching here means two products —
 * a report and a person — and the page argued the first sixteen times and the second
 * once, near the bottom. The human one now answers the sample report directly.
 */
export default function LandingPage(): React.ReactElement {
  return (
    <>
      <LandingHero />
      <DataStrip />
      <HowItWorksStrip />
      <SampleReport />

      {/* Straight after the report, because it is the answer to the reader the report
          did not convince: the same job, done by a person we checked. */}
      <CoachingBand />

      {/* The Academy, Draft Room, esports hub and streamer kit all ship, and none
          of them appeared anywhere on this page before. */}
      <ArsenalTabs />

      {/* The Arsenal panels draw the product; this shows it. Placed straight
          after them so the claim and the evidence sit together. */}
      <ProductShowcase />

      {/* The companion had never appeared on this page at all, and it is the one claim a
          competitor's website cannot answer. It follows the screenshots because those say
          "here are the real screens" and this is the screen a browser cannot draw. */}
      <DesktopBand />

      <ChampionPoolAudit />

      {/* Ten shipped screens the page had no way of mentioning — the reason a visitor read
          the product as one report and a few free tools. */}
      <AccountBand />

      <AcademyBand />
      <FreeToolsGrid />
      <DailyQuizStrip />
      <TierListPreview />
      <ProvenanceStrip />
      <PricingStrip />
      <ClosingSplash />
    </>
  );
}
