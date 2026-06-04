import { test, expect } from "@playwright/test";
import { E2E_RIOT_CONNECT } from "./helpers/constants";

// Uses storageState from auth-setup.setup.ts (inherited from playwright.config.ts smoke project)
test.describe("Riot Account Connection", () => {
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
    await expect(page.locator(`text=${E2E_RIOT_CONNECT.gameName}`)).toBeVisible({ timeout: 8_000 });
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
