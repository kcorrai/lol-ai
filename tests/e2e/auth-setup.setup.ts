import { test as setup } from "@playwright/test";
import { E2E_USER, AUTH_FILE } from "./helpers/constants";

// Runs as a Playwright "setup" project — after the webServer starts.
// Logs in with the seeded test user and saves cookies to AUTH_FILE so
// authenticated smoke tests can reuse the session.
setup("authenticate", async ({ page }) => {
  await page.goto("/login");

  await page.fill("#email", E2E_USER.email);
  await page.fill("#password", E2E_USER.password);
  await page.click('button[type="submit"]');

  // Wait until the dashboard confirms we're authenticated
  await page.waitForURL("**/dashboard", { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
