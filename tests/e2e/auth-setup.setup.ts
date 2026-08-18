import { test as setup } from "@playwright/test";
import { E2E_USER, AUTH_FILE } from "./helpers/constants";

// Runs as a Playwright "setup" project — after the webServer starts.
// Logs in with the seeded test user and saves cookies to AUTH_FILE so
// authenticated smoke tests can reuse the session.
setup("authenticate", async ({ page }) => {
  await page.goto("/login");

  // The login page fires its own /api/auth/session and /api/auth/providers calls
  // on mount, and NextAuth mints the CSRF cookie on whichever /api/auth request
  // reaches it first. Cold, those are still in flight when a script can already
  // type, so a submit that overlaps them posts one response's token against
  // another's cookie — rejected, and the page bounces back here. A person cannot
  // fill a form that fast; waiting for the page to settle is what keeps this a
  // test of logging in rather than of a cold-start race.
  await page.waitForLoadState("networkidle");

  await page.fill("#email", E2E_USER.email);
  await page.fill("#password", E2E_USER.password);
  await page.click('button[type="submit"]');

  // Wait until the dashboard confirms we're authenticated.
  //
  // Generous because this is the first thing to reach the dashboard under
  // `next dev`, where a route pays its whole compile on the request that gets
  // there first. Warm, this takes about two seconds; cold it has blown a 15s
  // budget, and when it does the entire suite is skipped for a reason that has
  // nothing to do with the product.
  await page.waitForURL("**/dashboard", { timeout: 60_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
