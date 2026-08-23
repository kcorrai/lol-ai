import { test, expect } from "@playwright/test";

// Free tools are public — run these without any auth state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Public free tools", () => {
  test("hub lists all four tools and is reachable without login", async ({ page }) => {
    await page.goto("/tools");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Free LoL Tools" })).toBeVisible();
    // Case-insensitive: the hub moved to sentence case in the LaneIQ redesign,
    // and which letters are capitals is a design call, not behaviour.
    for (const name of ["Counter picker", "Matchup analyzer", "Draft analyzer", "Tier list"]) {
      await expect(page.getByRole("link", { name: new RegExp(name, "i") }).first()).toBeVisible();
    }
  });

  test("anonymous user can open the counter picker from the hub", async ({ page }) => {
    await page.goto("/tools");
    await page
      .getByRole("link", { name: /Counter picker/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/tools\/counter-picker/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Counter Picker" })).toBeVisible();
  });

  test("old tool URLs redirect to the new public routes", async ({ page }) => {
    await page.goto("/counter");
    await expect(page).toHaveURL(/\/tools\/counter-picker/);
    await page.goto("/matchup");
    await expect(page).toHaveURL(/\/tools\/matchup/);
  });

  // `/draft` used to redirect here too. It is the live draft room's own page now
  // (TASK-307) and a redirect wins over a page, so the entry had to go — the
  // analyser keeps /tools/draft-analyzer. Asserted so the redirect cannot come
  // back and quietly make the room unreachable again.
  test("/draft serves the draft room, not the analyzer", async ({ page }) => {
    await page.goto("/draft");
    await expect(page).toHaveURL(/\/draft$/);
    await expect(page.getByRole("heading", { name: "Draft room" })).toBeVisible();

    await page.goto("/tools/draft-analyzer");
    await expect(page).toHaveURL(/\/tools\/draft-analyzer/);
  });
});
