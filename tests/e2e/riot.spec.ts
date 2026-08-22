import { test, expect } from "@playwright/test";
import { createTestPrisma } from "./helpers/db";
import { E2E_RIOT_CONNECT, E2E_USER } from "./helpers/constants";

async function setPlan(plan: "free" | "pro"): Promise<void> {
  const prisma = createTestPrisma();
  try {
    await prisma.subscription.updateMany({
      where: { user: { email: E2E_USER.email } },
      data: { plan },
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Uses storageState from auth-setup.setup.ts (inherited from playwright.config.ts smoke project)
test.describe("Riot Account Connection", () => {
  // `free` allows exactly one Riot account (PLAN_LIMITS.free.maxRiotAccounts),
  // and global-setup already spends it on the pre-connected account that the
  // coaching and share specs read from. So connecting a *second* account —
  // which is all this file does — is a Pro capability, and a free user is
  // refused at `assertCanAddRiotAccount` before any Riot call is made. That
  // refusal is correct product behaviour, so the spec buys the plan it needs
  // rather than the product losing the limit.
  test.beforeAll(async () => {
    await setPlan("pro");
  });

  // Handed straight back: nothing downstream should inherit a plan this file
  // bought, and free is what global-setup seeds.
  test.afterAll(async () => {
    await setPlan("free");
  });
  test("Connect — valid Riot ID creates account and redirects to dashboard", async ({ page }) => {
    await page.goto("/settings/accounts");

    // Fill the connection form
    await page.getByPlaceholder("YourName").fill(E2E_RIOT_CONNECT.gameName);
    await page.getByPlaceholder("EUW").fill(E2E_RIOT_CONNECT.tagLine);
    await page.selectOption("select", E2E_RIOT_CONNECT.region);

    await page.getByRole("button", { name: "Connect Account" }).click();

    // Redirected to dashboard on success
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("Connect — newly connected account appears in accounts page", async ({ page }) => {
    await page.goto("/settings/accounts");

    // The account connected in the previous test should appear in the list.
    // Since tests run sequentially and share DB state, the account persists.
    //
    // Matched on the full Riot ID, and scoped to the page body: "E2ESmoke" is a
    // prefix of the pre-seeded "E2ESmokeLinked", so the bare game name matches
    // the wrong account as well as the right one — and matches it in the
    // sidebar too, which is a strict-mode violation rather than an assertion.
    await expect(
      page.getByRole("main").getByText(`${E2E_RIOT_CONNECT.gameName}#${E2E_RIOT_CONNECT.tagLine}`)
    ).toBeVisible({ timeout: 8_000 });
  });

  test("Connect — duplicate protection shows error for already-connected account", async ({ page }) => {
    await page.goto("/settings/accounts");

    // Try connecting the same account again
    await page.getByPlaceholder("YourName").fill(E2E_RIOT_CONNECT.gameName);
    await page.getByPlaceholder("EUW").fill(E2E_RIOT_CONNECT.tagLine);
    await page.selectOption("select", E2E_RIOT_CONNECT.region);

    await page.getByRole("button", { name: "Connect Account" }).click();

    // Error message shown — account already connected
    await expect(
      page.locator("text=already connected")
    ).toBeVisible({ timeout: 8_000 });
  });
});
