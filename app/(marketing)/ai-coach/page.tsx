import type { Metadata } from "next";
import { CoachHero } from "./CoachHero";
import { CoachSteps } from "./CoachSteps";
import { ReportTypes } from "./ReportTypes";
import { CoachSurfaces } from "./CoachSurfaces";
import { SampleReport } from "../components/laneiq/SampleReport";
import { PricingStrip } from "../components/laneiq/PricingStrip";
import { ClosingSplash } from "../components/laneiq/ClosingSplash";

/**
 * The AI coach, for somebody who has not signed up.
 *
 * The product's flagship had no public page at all. Its only entry in the top bar pointed at
 * `/coaching`, which `middleware.ts` guards, so the visitor deciding whether this was worth an
 * account was answered with a login form — and the landing page's `CoachingBand` is about
 * booking a human, which is a different product.
 *
 * It lives at `/ai-coach` and is served at `/coaching`. The middleware rewrites the index of
 * the coaching section here when there is no session, so a visitor keeps the address the top
 * bar gave them and a signed-in player still gets their own reports at it. That is why the
 * canonical below is `/coaching` and not this file's own path: one product, one URL, and this
 * route is the half of it that does not need a session.
 */
export const metadata: Metadata = {
  title: { absolute: "AI Coach for League of Legends — Your Games Read, One Habit Named" },
  description:
    "Paste your Riot ID and get a free read of your last 10 games, no account. The full AI coach opens your matches with their timelines, grades them against your own rank, and returns a session review, a champion focus or a climb roadmap.",
  alternates: { canonical: "/coaching" },
  openGraph: {
    title: "LoL AI Coach — your games read, one habit named",
    description:
      "Not a tier list. It opens your own matches, grades them against the rank you are in, and names the thing you keep doing.",
    type: "website",
  },
};

export default function AiCoachPage(): React.ReactElement {
  return (
    <>
      <CoachHero />
      <CoachSteps />

      {/* The worked example, verbatim from the landing page. It carries its own `id="report"`,
          which is what the hero's "the full report" link points at. */}
      <SampleReport />

      <ReportTypes />
      <CoachSurfaces />
      <PricingStrip />

      {/* The ask again, for a reader who came down the whole page. It also closes the
          section stack, every one of which carries top padding and no bottom. */}
      <ClosingSplash />
    </>
  );
}
