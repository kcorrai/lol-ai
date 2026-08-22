import { test, expect } from "@playwright/test";
import { E2E_MATCH_PREFIX, E2E_RIOT_PRE } from "./helpers/constants";
import {
  creatorPrisma,
  creatorState,
  minutesAgo,
  OVERLAY_KEY,
  resetKit,
  restoreSyncState,
  seedRankedHistory,
} from "./helpers/creator";

// LA-25. What an OBS Browser Source and a chat bot see.
//
// Neither can carry a session, so every case here runs with none — that is the
// assertion rather than a shortcut, and it is the thing no unit test can stand
// in for. The key is the only credential in play (ADR-026).

const DELAY_MATCH_ID = `${E2E_MATCH_PREFIX}CREATOR_DELAY`;

test.use({ storageState: { cookies: [], origins: [] } });

test.afterAll(async () => {
  await restoreSyncState();
  await creatorPrisma.$disconnect();
});

test.describe("Streamer Kit overlay", () => {
  test.describe("in a browser source", () => {
    test.beforeAll(async () => {
      await resetKit({ goal: true });
      await seedRankedHistory();
    });

    test("the rank overlay opens with no session at all", async ({ page }) => {
      await page.goto(`/overlay/${OVERLAY_KEY}/rank`);

      await expect(page).not.toHaveURL(/\/login/);
      // First past the post: this request compiles both the overlay route and
      // `/api/overlay/[key]` under `next dev`, and the widget paints only once
      // that fetch answers. Every later case here reads a warm route inside the
      // default budget — including the one below, which asserts the same text on
      // the same page and passed five seconds after this one gave up.
      await expect(page.getByText("Emerald II")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText("55 LP")).toBeVisible();
      await expect(page.getByText("+115 LP this session")).toBeVisible();
    });

    /**
     * The one thing an overlay must not do is paint. A Browser Source composites
     * the page onto the scene, so a `body` that keeps the app's background puts a
     * solid dark rectangle on the stream — which is what the `:has()` reset in
     * `app/overlay/layout.tsx` exists to prevent, and what a change to
     * `globals.css` could quietly undo.
     */
    test("and paints nothing behind itself", async ({ page }) => {
      await page.goto(`/overlay/${OVERLAY_KEY}/rank`);
      await expect(page.getByText("Emerald II")).toBeVisible();

      await expect(page.locator("body")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(page.locator("body")).toHaveCSS("background-image", "none");
    });

    /** An overlay URL in a search index is a leaked capability. */
    test("and asks not to be indexed", async ({ page }) => {
      await page.goto(`/overlay/${OVERLAY_KEY}/rank`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });

    test("the goal overlay counts from where the session opened", async ({ page }) => {
      await page.goto(`/overlay/${OVERLAY_KEY}/goal`);

      await expect(page.getByText("Road to Emerald I")).toBeVisible();
      await expect(page.getByText("45 LP to go")).toBeVisible();
      // 115 LP gained of the 160 the goal was away when the session opened.
      await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "72");
    });

    test("an unknown key says so rather than showing an empty box", async ({ page }) => {
      await page.goto("/overlay/notARealOverlayKey0000/rank");
      await expect(page.getByText(/not active/i)).toBeVisible();
    });

    test("a malformed key never reaches the database", async ({ page }) => {
      const res = await page.goto("/overlay/short/rank");
      expect(res?.status()).toBe(404);
    });
  });

  test.describe("through a chat bot", () => {
    test.beforeAll(async () => {
      await resetKit();
      await seedRankedHistory();
    });

    test("one plain-text line, never a JSON envelope", async ({ request }) => {
      const res = await request.get(`/api/overlay/${OVERLAY_KEY}/chat/rank`);

      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("text/plain");

      const body = await res.text();
      // A bot pastes the body verbatim, so a wrapper or a second line is exactly
      // what a broken command looks like in chat.
      expect(body).not.toContain("{");
      expect(body.split("\n")).toHaveLength(1);
      expect(body).toContain("Emerald II");
      expect(body).toContain("+115 LP this session");
    });

    /**
     * Every failure is a 200 with a readable sentence, because a bot pastes the
     * body of whatever it fetched — a 404's body would go into chat as-is.
     */
    test("an unknown key answers in words, not in a status code", async ({ request }) => {
      const res = await request.get("/api/overlay/notARealOverlayKey0000/chat/rank");

      expect(res.status()).toBe(200);
      expect(await res.text()).toBe("This LaneIQ command is not set up correctly.");
    });

    test("an unknown command says which half is wrong", async ({ request }) => {
      const res = await request.get(`/api/overlay/${OVERLAY_KEY}/chat/nonsense`);

      expect(res.status()).toBe(200);
      expect(await res.text()).toBe("Unknown LaneIQ command.");
    });
  });

  /**
   * The differentiator (ADR-026). A stat overlay that stays real-time while the
   * broadcast runs behind contradicts the video and tells a sniper that a game
   * just ended. These two cases are the proof that the delay withholds one.
   */
  test.describe("the broadcast delay", () => {
    test.beforeAll(async () => {
      await seedRankedHistory();

      const match = await creatorPrisma.match.create({
        data: {
          matchId: DELAY_MATCH_ID,
          region: "euw1",
          queueId: 420,
          queueType: "RANKED_SOLO_5x5",
          gameMode: "CLASSIC",
          gameDuration: 1500,
          gameStart: minutesAgo(26),
          // A minute ago: inside a fifteen-minute delay, outside no delay at all.
          gameEnd: minutesAgo(1),
          gameVersion: "14.10.1",
          winningTeam: 100,
          rawDataHash: "e2e-creator-delay-hash",
        },
        select: { id: true },
      });

      await creatorPrisma.matchParticipant.create({
        data: {
          matchId: match.id,
          riotAccountId: creatorState.riotAccountId,
          puuid: E2E_RIOT_PRE.mockPuuid,
          teamId: 100,
          championId: 222,
          championName: "Jinx",
          position: "BOTTOM",
          kills: 12,
          deaths: 2,
          assists: 6,
          cs: 260,
          csPerMinute: "10.40",
          goldEarned: 17000,
          goldPerMinute: "680.00",
          damageDealt: 42000,
          damageTaken: 15000,
          damageHealed: 1200,
          visionScore: 21,
          wardsPlaced: 7,
          wardsKilled: 2,
          controlWardsBought: 2,
          turretsDestroyed: 3,
          objectivesStolen: 0,
          firstBlood: false,
          won: true,
          timeSpentDead: 40,
          totalTimeCCDealt: 90,
          itemIds: [3006, 6672, 3031, 3036, 3072, 0],
          summonerSpell1: 4,
          summonerSpell2: 7,
        },
      });
    });

    // The fresh game exists only for this describe. While it does it is the most
    // recent match in the database, which every other "last game" surface in the
    // suite would otherwise pick up.
    test.afterAll(async () => {
      await creatorPrisma.matchParticipant.deleteMany({
        where: { match: { matchId: DELAY_MATCH_ID } },
      });
      await creatorPrisma.match.deleteMany({ where: { matchId: DELAY_MATCH_ID } });
    });

    test("withholds a game the stream has not reached yet", async ({ request }) => {
      await resetKit({ delaySeconds: 900 });

      const body = await (await request.get(`/api/overlay/${OVERLAY_KEY}/chat/lastgame`)).text();

      expect(body).not.toContain("Jinx");
      // The most recent game old enough to show is one of the seeded ones.
      expect(body).toContain("Ahri");
    });

    test("and shows it once the delay is off", async ({ request }) => {
      await resetKit({ delaySeconds: 0 });

      const body = await (await request.get(`/api/overlay/${OVERLAY_KEY}/chat/lastgame`)).text();

      expect(body).toContain("Jinx");
      expect(body).toContain("12/2/6");
    });
  });
});
