import { test, expect } from "@playwright/test";

// Keep in sync with TOUR_STORAGE_KEY in src/components/onboarding/tour/tourSteps.ts
const TOUR_KEY = "lolai_coach_tour_v1";

test.describe("Coach onboarding tour", () => {
  test("first visit shows the coach tour; Skip persists dismissal", async ({ page }) => {
    // Force a clean first-run on the app origin, then reload so CoachTour re-gates.
    await page.goto("/dashboard");
    await page.evaluate((k) => localStorage.removeItem(k), TOUR_KEY);
    await page.reload();

    // Welcome step from the coach mascot.
    await expect(page.getByText("I'm your AI Coach")).toBeVisible({ timeout: 10_000 });

    // Advance into the progression step.
    await page.getByRole("button", { name: /Show me/ }).click();
    await expect(page.getByText("This is your progression")).toBeVisible({ timeout: 5_000 });

    // Skip via the close button.
    await page.getByRole("button", { name: "Skip tour" }).click();
    await expect(page.getByText("This is your progression")).toBeHidden();

    // The dismissal flag persists → a reload does not reopen the tour.
    const flag = await page.evaluate((k) => localStorage.getItem(k), TOUR_KEY);
    expect(flag).toBe("1");
    await page.reload();
    await expect(page.getByText("I'm your AI Coach")).toBeHidden();
  });
});
