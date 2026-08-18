import { test, expect } from "@playwright/test";
import { createTestPrisma } from "./helpers/db";
import { E2E_USER } from "./helpers/constants";

// Keep in sync with GUIDE_STORAGE_KEY in src/domains/onboarding/guide/guideSteps.ts
const GUIDE_KEY = "lolai_first_journey_v1";

// The seeded E2E user already has an account, matches and a completed report, so the forced journey
// auto-fast-forwards past connect/sync/generate. This spec verifies the engine drives the user
// across pages and that finishing sets the bypass-proof DB gate.
test.describe("Forced first-journey onboarding", () => {
  test.beforeEach(async () => {
    const prisma = createTestPrisma();
    try {
      await prisma.profile.updateMany({
        where: { user: { email: E2E_USER.email } },
        data: { onboardingCompletedAt: null },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  // Put the gate back even when the test above fails partway. Opening the forced
  // journey is a change to the shared seeded account, and an unfinished tour leaves
  // a full-screen overlay on every page: `riot.spec` and `share.spec` then fail on
  // clicks that land on the backdrop instead of the control, which reads as seven
  // broken features rather than one test that did not clean up after itself.
  test.afterEach(async () => {
    const prisma = createTestPrisma();
    try {
      await prisma.profile.updateMany({
        where: { user: { email: E2E_USER.email } },
        data: { onboardingCompletedAt: new Date() },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test("drives the user across pages and completion is persisted", async ({ page }) => {
    await page.goto("/dashboard");
    await page.evaluate((k) => localStorage.removeItem(k), GUIDE_KEY);
    await page.reload();

    // Welcome — the coach greets the user.
    await expect(page.getByText("Welcome, summoner")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Let's go/ }).click();

    // Fast-forwarded to "open a match" — click the spotlighted newest game.
    await expect(page.getByText("Open a match")).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-tour="match-row"]').first().click();

    // Match breakdown explainer (manual).
    await expect(page.getByText("This is a match breakdown")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Got it/ }).click();

    // Reports → (generate auto-skips, report already complete) → Improvement → Badges → Leaderboard.
    await expect(page.getByText("Now, your AI reports")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Take me there/ }).click();

    await expect(page.getByText("Your improvement plan")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Take me there/ }).click();

    await expect(page.getByText("Earn badges as you climb")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Take me there/ }).click();

    await expect(page.getByText("See where you rank")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Take me there/ }).click();

    // Finish — completes onboarding.
    await expect(page.getByText("You're all set!")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Start climbing/ }).click();

    // Overlay is gone and the gate is persisted server-side.
    await expect(page.getByText("You're all set!")).toBeHidden({ timeout: 10_000 });

    const prisma = createTestPrisma();
    try {
      const profile = await prisma.profile.findFirst({
        where: { user: { email: E2E_USER.email } },
        select: { onboardingCompletedAt: true },
      });
      expect(profile?.onboardingCompletedAt).not.toBeNull();
    } finally {
      await prisma.$disconnect();
    }
  });
});
