import { test, expect } from "@playwright/test";
import { E2E_USER } from "./helpers/constants";

// Auth tests intentionally bypass storageState — they test login/logout directly.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  test("Register — new user can create an account", async ({ page }) => {
    const uniqueEmail = `reg-${Date.now()}@e2e-reg.test`;

    await page.goto("/register");
    await expect(page).toHaveTitle(/Create account/);

    await page.fill("#name", "New Player");
    await page.fill("#email", uniqueEmail);
    await page.fill("#password", "ValidPass123!");
    await page.fill("#confirmPassword", "ValidPass123!");
    // Sign-up gates its submit on the terms checkbox (TASK-315).
    await page.check("#terms");
    await page.click('button[type="submit"]');

    // After registration, redirected to login with success param
    await page.waitForURL("**/login?registered=1", { timeout: 10_000 });
    await expect(page).toHaveURL(/registered=1/);
  });

  test("Register — rejects duplicate email", async ({ page }) => {
    await page.goto("/register");

    await page.fill("#name", E2E_USER.name);
    await page.fill("#email", E2E_USER.email);
    await page.fill("#password", E2E_USER.password);
    await page.fill("#confirmPassword", E2E_USER.password);
    await page.check("#terms");
    await page.click('button[type="submit"]');

    // Error message visible (email already taken)
    await expect(page.locator("text=already exists")).toBeVisible({ timeout: 8_000 });
  });

  test("Login — valid credentials redirect to dashboard", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Sign in/);

    await page.fill("#email", E2E_USER.email);
    await page.fill("#password", E2E_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("Login — wrong password shows error", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#email", E2E_USER.email);
    await page.fill("#password", "definitely-wrong-password");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Incorrect email or password")).toBeVisible({ timeout: 8_000 });
  });

  test("Logout — clicking logout redirects to /login", async ({ page }) => {
    // First log in
    await page.goto("/login");
    await page.fill("#email", E2E_USER.email);
    await page.fill("#password", E2E_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 15_000 });

    // Logout via sidebar button (title="Log out")
    await page.click('[title="Log out"]');
    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("Protected route — unauthenticated access redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
