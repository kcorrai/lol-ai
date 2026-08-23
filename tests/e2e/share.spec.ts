import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { STATE_FILE, E2E_SHARE_TOKEN, E2E_RIOT_PRE } from "./helpers/constants";
import type { E2EState } from "./helpers/db";

function getState(): E2EState {
  return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as E2EState;
}

// `navigator.clipboard.writeText` rejects without an explicit grant, and the
// button only says "Copied!" from that promise's `then`. Scoped to this file
// rather than the whole smoke project: this is the one spec that copies.
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.describe("Share Report", () => {
  test("Share button — generates link and displays URL", async ({ page }) => {
    const { reportId } = getState();

    await page.goto(`/coaching/${reportId}`);
    await expect(page.getByRole("button", { name: "Copy share link" })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Copy share link" }).click();

    // "Copied!" feedback appears briefly
    await expect(page.getByText("Copied!")).toBeVisible({ timeout: 5_000 });

    // Share URL is displayed below the button (monospace font element)
    await expect(page.locator(`text=${E2E_SHARE_TOKEN}`)).toBeVisible({ timeout: 5_000 });
  });

  test("Public share page — renders without authentication", async ({ browser }) => {
    // Create a new context with NO auth cookies to verify it's truly public
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    await page.goto(`/share/report/${E2E_SHARE_TOKEN}`);

    // Player name from seeded Riot account
    await expect(page.locator(`h1:has-text("${E2E_RIOT_PRE.gameName}")`)).toBeVisible({
      timeout: 10_000,
    });

    // Tag line displayed
    await expect(page.locator(`text=#${E2E_RIOT_PRE.tagLine}`)).toBeVisible();

    // Seeded summary visible
    await expect(page.locator("text=Strong early game mechanics")).toBeVisible();

    // CTA to get own report
    await expect(page.getByRole("link", { name: "Get Your AI Coaching Report" })).toBeVisible();

    // Branding
    await expect(page.locator("text=LoL AI Coach")).toBeVisible();

    await context.close();
  });

  test("Public share page — invalid token shows not-found state", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    await page.goto("/share/report/invalid-token-that-does-not-exist");

    await expect(page.locator("text=Report not found")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole("link", { name: "Get Your AI Report" })).toBeVisible();

    await context.close();
  });

  test("OG image endpoint — returns 200 with image content-type", async ({ page }) => {
    const response = await page.request.get(`/api/og/report/${E2E_SHARE_TOKEN}`);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/image\//);
  });

  test("OG image endpoint — invalid token returns 404", async ({ page }) => {
    const response = await page.request.get("/api/og/report/no-such-token-here");
    expect(response.status()).toBe(404);
  });

  test("Share API — public JSON endpoint returns report data", async ({ page }) => {
    const response = await page.request.get(`/api/share/${E2E_SHARE_TOKEN}`);

    expect(response.status()).toBe(200);
    const body = (await response.json()) as { data: { gameName: string; reportType: string } };
    expect(body.data.gameName).toBe(E2E_RIOT_PRE.gameName);
    expect(body.data.reportType).toBe("session_review");
  });
});
