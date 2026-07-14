import { test, expect } from "@playwright/test";

// Free tools are public — run these without any auth state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Public free tools", () => {
  test("hub lists all four tools and is reachable without login", async ({ page }) => {
    await page.goto("/tools");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Free LoL Tools" })).toBeVisible();
    for (const name of ["Counter Picker", "Matchup Analyzer", "Draft Analyzer", "Tier List"]) {
      await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
    }
  });

  test("anonymous user can open the counter picker from the hub", async ({ page }) => {
    await page.goto("/tools");
    await page.getByRole("link", { name: /Counter Picker/ }).first().click();
    await expect(page).toHaveURL(/\/tools\/counter-picker/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Counter Picker" })).toBeVisible();
  });

  test("old tool URLs redirect to the new public routes", async ({ page }) => {
    await page.goto("/counter");
    await expect(page).toHaveURL(/\/tools\/counter-picker/);
    await page.goto("/matchup");
    await expect(page).toHaveURL(/\/tools\/matchup/);
    await page.goto("/draft");
    await expect(page).toHaveURL(/\/tools\/draft-analyzer/);
  });
});
