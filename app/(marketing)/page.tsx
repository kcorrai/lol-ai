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
import { ExploreTabs } from "./components/laneiq/ExploreTabs";

export const metadata: Metadata = {
  title: { absolute: "LaneIQ — Free LoL Tools, AI Coaching & Real Coaches" },
  description:
    "Paste your Riot ID and get the one habit costing you LP — or book a human coach whose rank we read from their own Riot account. Free League of Legends tools: counters, matchups, draft analysis and tier lists from real ranked data. Plus a 61-lesson academy, a fearless draft room and live esports. No login required for the tools.",
  openGraph: {
    title: "LaneIQ — Free LoL Tools, AI Coaching & Real Coaches",
    description:
      "Free LoL tools from real ranked data — counters, matchups, drafts, tier lists — plus AI coaching on your own games and human coaches whose rank we checked.",
    type: "website",
  },
};

/**
 * The page reads as an argument, in order: here is the ask, here is how it works, here is
 * what you get, here is the person if the report is not enough, here is everything else we
 * are, and here is what it costs.
 *
 * It used to be seventeen sections — eleven screens on a desktop, twenty-three on a phone.
 * Seven of them now sit behind one row of tabs in `ExploreTabs`; none was dropped.
 *
 * `SampleReport` follows the hero with only the three-step strip between them, so a reader
 * sees what they get before being asked to scroll any further. The data strip that used to
 * sit between them moved down beside `ProvenanceStrip`, which is the argument it was making.
 *
 * `CoachingBand` answers the sample report directly: coaching here means two products — a
 * report and a person — and the human one is for the reader the report did not convince.
 */
export default function LandingPage(): React.ReactElement {
  return (
    <>
      <LandingHero />
      <HowItWorksStrip />
      <SampleReport />
      <CoachingBand />

      {/* The six pillars, one panel. */}
      <ArsenalTabs />

      {/* The one claim a competitor's website cannot answer, so it keeps a band of its own. */}
      <DesktopBand />

      <ExploreTabs
        tabs={[
          {
            key: "tools",
            label: "Free tools",
            hint: "Counters, matchups, tier list",
            content: (
              <>
                <FreeToolsGrid />
                <TierListPreview />
              </>
            ),
          },
          {
            key: "inside",
            label: "Inside the app",
            hint: "Dashboard, daily, esports",
            content: <ProductShowcase />,
          },
          {
            key: "account",
            label: "Your account",
            hint: "History, goals, champion pool",
            content: (
              <>
                <AccountBand />
                <ChampionPoolAudit />
              </>
            ),
          },
          {
            key: "academy",
            label: "Academy",
            hint: "61 lessons, then ranked",
            content: <AcademyBand />,
          },
          {
            key: "daily",
            label: "Daily game",
            hint: "A new quiz every day",
            content: <DailyQuizStrip />,
          },
        ]}
      />

      <DataStrip />
      <ProvenanceStrip />
      <PricingStrip />
      <ClosingSplash />
    </>
  );
}
