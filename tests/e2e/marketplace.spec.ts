import { test, expect } from "@playwright/test";
import { createTestPrisma } from "./helpers/db";

// LA-19. The coach marketplace, exercised the way a person meets it: apply,
// get approved, list something, and be findable.
//
// The seeded E2E user plays the coach here. The student side of a booking needs
// a second account and a coach with published hours, which is more setup than a
// smoke test should carry — the booking rules themselves are covered by unit
// tests and were driven end to end by hand against a real database.

const prisma = createTestPrisma();

test.afterAll(async () => {
  await prisma.$disconnect();
});

/** Clears whatever a previous run left, so the suite can run twice in a row. */
async function resetCoachProfile(): Promise<void> {
  await prisma.coachProfile.deleteMany({ where: { user: { email: "e2e-smoke@lolai.test" } } });
}

test.describe("Coach marketplace", () => {
  test.describe("the storefront is public", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("opens signed out, because it is the acquisition surface", async ({ page }) => {
      await page.goto("/coaches");

      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: /rank they claim/i, level: 1 })
      ).toBeVisible();
    });

    /**
     * `/coaches` starts with `/coach`, so a bare prefix match in the middleware
     * would put a login wall in front of the storefront. This is the assertion
     * that catches that if the matching ever regresses.
     */
    test("but the coach console is not", async ({ page }) => {
      await page.goto("/coach");
      await expect(page).toHaveURL(/\/login/);
    });

    test("nor is the session list", async ({ page }) => {
      await page.goto("/sessions");
      await expect(page).toHaveURL(/\/login/);
    });

    test("an unfiltered storefront canonicalises to a bare /coaches", async ({ page }) => {
      await page.goto("/coaches?sort=rating");

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute("href", /\/coaches$/);
    });
  });

  test.describe("becoming a coach", () => {
    test.beforeEach(async () => {
      await resetCoachProfile();
    });

    test("apply, get approved, and appear on the storefront", async ({ page }) => {
      // The application form. `/coach/apply` redirects to the profile page,
      // which serves both the application and every edit after it.
      await page.goto("/coach/apply");
      await expect(page).toHaveURL(/\/coach\/profile/);

      // The chips go first on purpose. The form is only rendered once its query
      // has resolved, but React attaches the change handlers a beat after that,
      // and a `fill` landing in that gap writes the DOM value without ever
      // reaching React state — the next render then throws it away. A chip is
      // pure state, so it cannot report itself checked until React is live;
      // waiting on that is the one signal here that actually means "hydrated".
      //
      // The click has to be retried, not just the assertion: `toBeChecked` polls
      // the DOM, so a click swallowed before hydration is never replayed and the
      // test fails for good. Guarded by `isChecked` so a retry cannot toggle a
      // chip that already took.
      const english = page
        .getByRole("group", { name: "Languages" })
        .getByRole("checkbox", { name: "English" });
      await expect(async () => {
        if (!(await english.isChecked())) await english.click();
        await expect(english).toBeChecked({ timeout: 1_000 });
      }).toPass({ timeout: 15_000 });

      await page.getByRole("group", { name: "Regions" }).getByRole("checkbox", { name: "EUW" }).click();
      await page.getByRole("group", { name: "Roles" }).getByRole("checkbox", { name: "Jungle" }).click();

      await page.locator("#displayName").fill("E2E Coach");
      await page.locator("#headline").fill("Smoke-test jungler");
      await page
        .locator("#bio")
        .fill(
          "A profile written by the end-to-end suite. It has to be long enough to pass the " +
            "minimum the submit check enforces, which is a product rule about what is worth a " +
            "reviewer's time rather than a validation detail."
        );

      await page.getByRole("button", { name: "Save profile" }).click();

      // Saved as a draft — nothing is public yet. Asserted on the status chip
      // rather than on prose, which is the part that carries the meaning.
      await expect(page.getByText("Draft", { exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Send application" }).click();
      await expect(page.getByText("In review", { exact: false })).toBeVisible();

      // Approval is an admin act, and the E2E user is not the admin. Doing it
      // through the service would need a server context, so the row is moved
      // directly — what is being tested here is that the storefront picks it up.
      await prisma.coachProfile.updateMany({
        where: { displayName: "E2E Coach" },
        data: { status: "APPROVED", slug: "e2e-coach", publishedAt: new Date() },
      });
      await prisma.coachListing.create({
        data: {
          coachProfile: { connect: { slug: "e2e-coach" } },
          kind: "VOD_REVIEW",
          title: "One game, reviewed",
          description: "A listing written by the end-to-end suite so the card has a price on it.",
          durationMinutes: 60,
          priceCents: 3000,
          currency: "USD",
          deliveryHours: 48,
        },
      });

      await page.goto("/coaches");
      await expect(page.getByRole("link", { name: /E2E Coach/ })).toBeVisible();

      await page.goto("/coaches/e2e-coach");
      await expect(page.getByRole("heading", { name: "E2E Coach", level: 1 })).toBeVisible();
      await expect(page.getByText("One game, reviewed")).toBeVisible();

      // Under three reviews a coach shows "New coach" and no number at all.
      await expect(page.getByText("New coach").first()).toBeVisible();
    });

    test("a filter that matches nothing says so instead of showing everyone", async ({ page }) => {
      await prisma.coachProfile.updateMany({
        where: { user: { email: "e2e-smoke@lolai.test" } },
        data: { status: "APPROVED", slug: "e2e-coach-2", publishedAt: new Date() },
      });

      await page.goto("/coaches?minTier=CHALLENGER");
      await expect(page.getByText("No coach matches that")).toBeVisible();
    });
  });

  test.describe("the coach console", () => {
    test.beforeEach(async () => {
      await resetCoachProfile();
    });

    test("sends somebody with no profile to the application", async ({ page }) => {
      await page.goto("/coach");
      await expect(page).toHaveURL(/\/coach\/profile/);
    });
  });
});
