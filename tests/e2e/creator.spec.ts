import { test, expect } from "@playwright/test";
import { E2E_RIOT_PRE } from "./helpers/constants";
import {
  creatorPrisma,
  creatorState,
  OVERLAY_KEY,
  resetKit,
  restoreSyncState,
  seedRankedHistory,
} from "./helpers/creator";

// LA-25. The creator's own side of the Streamer Kit: turning it on, changing a
// setting that a viewer will see, and rolling the key when one leaks.
//
// The other half — what OBS and a chat bot see, with no session at all — is
// `creator-overlay.spec.ts`.

const RIOT_ID = `${E2E_RIOT_PRE.gameName}#${E2E_RIOT_PRE.tagLine}`;

test.afterAll(async () => {
  await restoreSyncState();
  await creatorPrisma.$disconnect();
});

test.describe("Streamer Kit dashboard", () => {
  test.describe("turning it on", () => {
    test.beforeEach(async () => {
      await creatorPrisma.creatorProfile.deleteMany({ where: { userId: creatorState.userId } });
    });

    test("mints a key and hands over a browser source URL", async ({ page }) => {
      await page.goto("/creator");

      await expect(page.getByRole("heading", { name: "Streamer Kit", level: 1 })).toBeVisible();
      await page.getByRole("button", { name: "Turn on creator mode" }).click();

      // The first field on the overlays tab is the rank widget's URL, and it is
      // the whole deliverable of this page: a line the creator pastes into OBS.
      const url = page.getByRole("textbox").first();
      // Budgeted for a cold route: this click is the first request to the
      // creator API in a run, `next dev` compiles it on that request, and the
      // field does not exist until it answers — the page still reads "Loading
      // your Streamer Kit…". Every later case in this file finds it warm.
      await expect(url).toHaveValue(/\/overlay\/[A-Za-z0-9_-]{22}\/rank$/, { timeout: 30_000 });

      const profile = await creatorPrisma.creatorProfile.findUnique({
        where: { userId: creatorState.userId },
        select: { overlayKey: true, enabled: true },
      });
      expect(profile?.enabled).toBe(true);
      await expect(url).toHaveValue(new RegExp(`/${profile?.overlayKey}/rank$`));
    });

    /**
     * Enabling is idempotent on purpose: a creator who clicks it twice, or comes
     * back to the page a week later, must not have the OBS source they already
     * pasted silently replaced.
     */
    test("coming back does not mint a second key", async ({ page }) => {
      await page.goto("/creator");
      await page.getByRole("button", { name: "Turn on creator mode" }).click();
      await expect(page.getByRole("textbox").first()).toHaveValue(/\/overlay\//);

      const first = await creatorPrisma.creatorProfile.findUnique({
        where: { userId: creatorState.userId },
        select: { overlayKey: true },
      });

      await page.reload();
      await expect(page.getByRole("textbox").first()).toHaveValue(
        new RegExp(`/${first?.overlayKey}/rank$`)
      );
    });
  });

  test.describe("without a session", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("the dashboard is behind the login wall", async ({ page }) => {
      await page.goto("/creator");
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("stream-safe mode", () => {
    test.beforeAll(async () => {
      await resetKit();
      await seedRankedHistory();
    });

    test("flipping it takes the Riot ID out of the chat reply", async ({ page, request }) => {
      const before = await (await request.get(`/api/overlay/${OVERLAY_KEY}/chat/rank`)).text();
      expect(before).toContain(RIOT_ID);

      await page.goto("/creator");
      await page.getByRole("button", { name: "Settings" }).click();

      const toggle = page.getByRole("switch", { name: "Stream-safe mode" });
      await expect(toggle).toHaveAttribute("aria-checked", "false");
      await toggle.click();

      const saved = page.waitForResponse(
        (res) => res.url().includes("/api/creator/me") && res.request().method() === "PUT"
      );
      await page.getByRole("button", { name: "Save settings" }).click();
      expect((await saved).ok()).toBe(true);

      const after = await (await request.get(`/api/overlay/${OVERLAY_KEY}/chat/rank`)).text();
      expect(after).not.toContain(RIOT_ID);
      // The figures survive — the mode hides who, not what.
      expect(after).toContain("Emerald II");
      expect(after).toContain("The streamer");
    });
  });

  test.describe("rolling the key", () => {
    test.beforeAll(async () => {
      await resetKit();
      await seedRankedHistory();
    });

    test("takes the overlay and the chat commands down together", async ({ page, request }) => {
      await page.goto("/creator");
      await expect(page.getByRole("textbox").first()).toHaveValue(
        new RegExp(`/${OVERLAY_KEY}/rank$`)
      );

      page.once("dialog", (dialog) => void dialog.accept());
      await page.getByRole("button", { name: "Roll key" }).click();

      await expect(page.getByRole("textbox").first()).not.toHaveValue(
        new RegExp(`/${OVERLAY_KEY}/rank$`)
      );

      const rolled = await creatorPrisma.creatorProfile.findUnique({
        where: { userId: creatorState.userId },
        select: { overlayKey: true },
      });
      expect(rolled?.overlayKey).not.toBe(OVERLAY_KEY);

      // One key covers both surfaces, which is the reason the confirm dialog is
      // worded the way it is — so the old one has to fail on both.
      const oldChat = await (await request.get(`/api/overlay/${OVERLAY_KEY}/chat/rank`)).text();
      expect(oldChat).toBe("This LaneIQ command is not set up correctly.");

      const newChat = await (
        await request.get(`/api/overlay/${rolled?.overlayKey}/chat/rank`)
      ).text();
      expect(newChat).toContain("Emerald II");
    });
  });
});
