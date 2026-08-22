import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// The profile route reaches for the database and the rate limiter before it
// renders anything; neither has a bearing on the JSX these tests exercise.
vi.mock("@/lib/api/rateLimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, retryAfterMs: 0, limit: 60 })),
  getIp: () => "127.0.0.1",
  rateLimitResponse: () => new Response(null, { status: 429 }),
}));
vi.mock("@/domains/identity/services/profileService", () => ({
  getPublicProfile: vi.fn(),
}));

import { GET as summonerOg } from "../../../app/api/og/summoner/route";
import { GET as profileOg } from "../../../app/api/og/profile/[slug]/route";
import { ReportOgCard } from "../../../app/api/og/report/[shareToken]/reportOgTemplate";
import { AchievementOgCard } from "../../../app/api/achievements/share/[achievementId]/achievementOgTemplate";
import { WeeklyCard } from "../../../app/api/cards/[token]/weeklyCardOg";
import { MasteryCard } from "../../../app/api/cards/[token]/masteryCardOg";
import { AcademyCard } from "../../../app/api/cards/[token]/academyCardOg";
import { CareerCard } from "../../../app/api/cards/[token]/careerCardOg";
import { getPublicProfile } from "@/domains/identity/services/profileService";
import type { PublicProfileData } from "@/domains/identity/services/profileService";
import { renderOgImage } from "@/lib/og/ogImage";
import { ACHIEVEMENT_CATALOG } from "@/types/achievement";
import type { PublicReport } from "@/domains/coaching/services/reportService";

// LA-41: `next/og` dynamic-imports Next's bundled @vercel/og, which loads its
// font and wasm assets via a path built from `import.meta.url` at *import*
// time — before ImageResponse is even constructed. On Windows that path came
// out malformed (`ERR_INVALID_URL`), 500ing every card/OG route regardless of
// what the route itself did. `patches/next+14.2.35.patch` fixes it; this test
// exercises the real bundled module (unmocked) so a `next` version bump that
// drops the patch, or a bad patch regen, fails here instead of only in local
// dev on Windows.
describe("next/og ImageResponse", () => {
  it("constructs and streams a real PNG without throwing", async () => {
    const res = new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%" }}>LA-41</div>,
      { width: 1200, height: 630 }
    );

    expect(res.status).toBe(200);
    const bytes = await res.arrayBuffer();
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});

// LA-53: satori refuses to lay out a block-level element that has more than one
// child, and says so by throwing mid-stream — so the route answers 200 and then
// the body fails. Nothing catches that in a unit test that stops at the JSX, and
// nothing catches it in a type check either, because the JSX is valid React.
// The only way to see it is to render. `{a} {b}` and `Label: {value}` inside a
// plain <div> are both two-or-more children, which is how four separate share
// surfaces shipped broken behind LA-41's crash.
async function expectRenders(el: ReactElement | ImageResponse): Promise<void> {
  const res = el instanceof ImageResponse ? el : new ImageResponse(el, { width: 1200, height: 630 });
  expect(res.status).toBe(200);
  expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(0);
}

async function expectBodyRenders(res: Response): Promise<void> {
  expect(res.status).toBe(200);
  expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(0);
}

const report: PublicReport = {
  reportId: "r1",
  reportType: "session_review",
  summary: "Ward the river before the second scuttle.",
  coachPersonaResponse: null,
  firstActionItem: null,
  gameName: "Faker",
  tagLine: "KR1",
  region: "kr",
  rankDisplay: "Challenger I · 1200 LP",
  topChampionName: "Azir",
  completedAt: null,
};

const profile: PublicProfileData = {
  displayName: "Faker",
  region: "kr",
  profileIconId: 1,
  rank: { tier: "CHALLENGER", division: "I", lp: 1200, wins: 300, losses: 200, hotStreak: false },
  winRate: 63,
  totalGames: 500,
  avgKda: 4.2,
  topChampions: [
    {
      name: "Azir",
      games: 120,
      wins: 80,
      winRate: 67,
      avgKda: 4.8,
      avgCsPerMinute: 8.9,
      avgVisionScore: 22,
      masteryLevel: 7,
      masteryPoints: 480000,
    },
  ],
  badges: [{ id: "b1", name: "Climber", tier: "GOLD", iconSlug: "climber" }],
  joinedAt: "2024-09-01",
  isPrivate: false,
};

describe("every OG surface lays out under satori", () => {
  it("og/summoner renders with only the parameters a bare share link carries", async () => {
    // The exact request from the bug report: no rank, no win rate, no champion.
    await expectBodyRenders(
      await summonerOg(new NextRequest("http://localhost/api/og/summoner?name=test&region=na1"))
    );
  });

  it("og/summoner renders with every parameter filled in", async () => {
    await expectBodyRenders(
      await summonerOg(
        new NextRequest(
          "http://localhost/api/og/summoner?name=Faker%23KR1&region=kr&rank=Challenger+I&wr=63&champ=Azir&tier=CHALLENGER"
        )
      )
    );
  });

  it("og/profile renders for a slug with no profile behind it", async () => {
    vi.mocked(getPublicProfile).mockResolvedValue(null);
    await expectBodyRenders(
      await profileOg(new NextRequest("http://localhost/api/og/profile/nobody"), {
        params: { slug: "nobody" },
      })
    );
  });

  // The populated profile is a separate case, not a nicer version of the one
  // above: the champion line and the badge count are each a whole <div> that
  // only exists when there is something to put in it.
  it("og/profile renders a populated profile", async () => {
    vi.mocked(getPublicProfile).mockResolvedValue(profile);
    await expectBodyRenders(
      await profileOg(new NextRequest("http://localhost/api/og/profile/faker-kr1"), {
        params: { slug: "faker-kr1" },
      })
    );
  });

  it("og/report renders a shared coaching report", async () => {
    await expectRenders(<ReportOgCard report={report} />);
  });

  it("achievement share card renders", async () => {
    await expectRenders(
      <AchievementOgCard achievement={ACHIEVEMENT_CATALOG[0]} gameName="Faker" />
    );
  });

  it("weekly card renders", async () => {
    await expectRenders(
      <WeeklyCard
        d={{
          cardType: "weekly",
          gameName: "Faker",
          tagLine: "KR1",
          lpDelta: 42,
          winRate: 63,
          gamesPlayed: 19,
          bestChampionName: "Azir",
          bestChampionWinRate: 71,
          masteryScore: 88,
          coachGrade: "A-",
          isPro: true,
        }}
      />
    );
  });

  it("weekly card renders for a free account with nothing optional filled in", async () => {
    await expectRenders(
      <WeeklyCard
        d={{
          cardType: "weekly",
          gameName: "Faker",
          tagLine: "KR1",
          lpDelta: 0,
          winRate: 0,
          gamesPlayed: 0,
          bestChampionName: "-",
          bestChampionWinRate: 0,
          masteryScore: null,
          coachGrade: null,
          isPro: false,
        }}
      />
    );
  });

  it("mastery card renders", async () => {
    await expectRenders(
      <MasteryCard
        d={{
          cardType: "mastery",
          gameName: "Faker",
          tagLine: "KR1",
          championName: "Azir",
          championImageUrl: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Azir.png",
          masteryScore: 88,
          masteryTier: "Sovereign",
          gamesPlayed: 120,
          isPro: true,
        }}
      />
    );
  });

  it("academy card renders", async () => {
    await expectRenders(
      <AcademyCard
        d={{
          cardType: "academy",
          displayName: "Faker",
          trackTitle: "Vision & Map",
          lessonsTotal: 7,
          lessonsMastered: 7,
          finishedAt: "2026-08-20",
        }}
      />
    );
  });

  it("career card renders", async () => {
    await expectRenders(
      <CareerCard
        d={{
          cardType: "career",
          gameName: "Faker",
          tagLine: "KR1",
          summonerLevel: 720,
          trackedFrom: "2024-09-01",
          totalGames: 1840,
          totalHours: 921,
          currentRank: "Challenger I",
          peakRank: "Challenger I",
          signatureChampion: "Azir",
          signatureChampionGames: 402,
          headline: "Two years on one champion.",
          isPro: true,
        }}
      />
    );
  });

  it("career card renders for a free account with no signature champion", async () => {
    await expectRenders(
      <CareerCard
        d={{
          cardType: "career",
          gameName: "Faker",
          tagLine: "KR1",
          summonerLevel: 30,
          trackedFrom: "2026-08-01",
          totalGames: 4,
          totalHours: 2,
          currentRank: "Unranked",
          peakRank: "Unranked",
          signatureChampion: null,
          signatureChampionGames: 0,
          headline: null,
          isPro: false,
        }}
      />
    );
  });

  it("the shared marketing card renders", async () => {
    await expectRenders(
      renderOgImage({ title: "LoL Tier List", subtitle: "Every role, every patch", badge: "Free" })
    );
  });
});
