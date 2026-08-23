import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { STATE_FILE } from "./helpers/constants";
import type { E2EState } from "./helpers/db";

function getState(): E2EState {
  return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as E2EState;
}

test.describe("Coaching Report", () => {
  test("Complete report — detail page renders summary and content", async ({ page }) => {
    const { reportId } = getState();

    await page.goto(`/coaching/${reportId}`);

    // Status badge
    await expect(page.getByText("complete")).toBeVisible({ timeout: 10_000 });

    // Summary section — seeded text
    await expect(page.locator("text=Strong early game mechanics")).toBeVisible({ timeout: 8_000 });

    // Coach says section
    await expect(page.locator("text=Your mechanics are solid")).toBeVisible();
  });

  test("Complete report — ShareReportButton is visible for completed reports", async ({ page }) => {
    const { reportId } = getState();

    await page.goto(`/coaching/${reportId}`);
    await expect(page.getByRole("button", { name: "Copy share link" })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Pending report — polling shows processing state", async ({ page }) => {
    const { reportId } = getState();

    // Intercept the report API to simulate a pending → complete transition.
    // This tests the polling UI without requiring real Inngest/AI execution.
    let pollCount = 0;
    await page.route(`/api/coaching/reports/${reportId}`, async (route) => {
      pollCount++;
      if (pollCount === 1) {
        // First call: return pending state
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: reportId,
              status: "pending",
              reportType: "session_review",
              matchesAnalyzed: [],
              summary: null,
              createdAt: new Date().toISOString(),
              completedAt: null,
              userRating: null,
              aiModelUsed: null,
              processingTimeMs: null,
              strengths: null,
              weaknesses: null,
              actionItems: null,
              coachPersonaResponse: null,
              estimatedRankPotential: null,
              championRecommendations: null,
              riotAccountId: "",
            },
            meta: { requestId: "e2e-mock" },
          }),
        });
      } else {
        // Subsequent calls: let through to the real API (returns complete)
        await route.continue();
      }
    });

    await page.goto(`/coaching/${reportId}`);

    // Pending spinner should briefly appear on first poll
    await expect(page.locator("text=AI is analyzing")).toBeVisible({ timeout: 5_000 });

    // After routing clears, subsequent poll returns complete report
    await expect(page.locator("text=Strong early game mechanics")).toBeVisible({ timeout: 15_000 });
  });

  test("Generate report — API accepts request and returns 202", async ({ page }) => {
    const { riotAccountId, matchIds } = getState();

    // Direct API call to verify the generate endpoint accepts the request.
    // We don't wait for completion (Inngest runs asynchronously).
    const response = await page.request.post("/api/coaching/generate", {
      data: {
        riotAccountId,
        reportType: "session_review",
        matchIds: matchIds.slice(0, 3),
      },
    });

    expect(response.status()).toBe(202);
    const body = (await response.json()) as { data: { reportId: string; status: string } };
    expect(body.data.status).toBe("pending");
    expect(body.data.reportId).toBeTruthy();
  });
});
