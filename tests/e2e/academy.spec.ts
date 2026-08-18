import { test, expect } from "@playwright/test";

// The Academy is public by design — lessons are the SEO surface. These run signed out,
// which is also the case that has to survive: an anonymous reader must be able to read a
// free lesson end to end and answer its drills without an account.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Academy", () => {
  test("hub is reachable without login and lists both tracks", async ({ page }) => {
    await page.goto("/academy");
    await expect(page).not.toHaveURL(/\/login/);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Learn the game");
    await expect(page.getByRole("link", { name: /Foundations/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Laning/ }).first()).toBeVisible();
  });

  test("hub recommends a first lesson and links to it", async ({ page }) => {
    await page.goto("/academy");

    await expect(page.getByText("Next up for you")).toBeVisible();
    await page.getByRole("link", { name: "Start lesson" }).click();

    // This click is the first request to reach the lesson route, which under
    // `next dev` pays that route's whole compile before the app-router
    // navigation commits — the URL does not move until the RSC payload lands.
    // The 5s default expect budget is a cold-compile failure, not a product one.
    await expect(page).toHaveURL(/\/academy\/[a-z-]+\/[a-z-]+/, { timeout: 30_000 });
    await expect(page.getByText("What you will be able to do")).toBeVisible();
  });

  test("track page lists its lessons in order", async ({ page }) => {
    await page.goto("/academy/foundations");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Foundations");
    await expect(page.getByRole("listitem")).toHaveCount(6);
    await expect(page.getByRole("link", { name: /Minions, Gold/ })).toBeVisible();
  });

  test("a free lesson grades its drills and reveals why the wrong answers lose", async ({
    page,
  }) => {
    await page.goto("/academy/laning/wave-states");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Four Wave States");

    // First drill: the quiz. Picking the wrong option still has to teach.
    await page.getByRole("button", { name: /The wave evens out/ }).click();
    await expect(page.getByText("Not quite")).toBeVisible();
    await expect(page.getByText(/Waves do not self-correct/)).toBeVisible();
    // The correct option is revealed alongside it.
    await expect(page.getByText(/Six minions kill three faster/)).toBeVisible();

    // Answering every drill on the page completes the lesson.
    await page.getByRole("button", { name: /Recall on the crash/ }).click();
    await expect(page.getByText("Lesson complete")).toBeVisible();
    await expect(page.getByText("Field assignment")).toBeVisible();
    await expect(page.getByRole("link", { name: /Next: Slow Push/ })).toBeVisible();
  });

  test("an answered drill cannot be answered again", async ({ page }) => {
    await page.goto("/academy/laning/wave-states");

    const correct = page.getByRole("button", { name: /Your wave grows and pushes harder/ });
    await correct.click();
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await expect(correct).toBeDisabled();
  });

  test("a pro lesson stops at the gate for a signed-out reader", async ({ page }) => {
    await page.goto("/academy/laning/freezing");

    // The free half is real teaching, not a teaser.
    await expect(page.getByText(/A freeze is a wave held stationary/)).toBeVisible();
    await expect(page.getByText("The rest of this lesson is Pro")).toBeVisible();
    await expect(page.getByRole("link", { name: "See Pro" })).toBeVisible();

    // Nothing from behind the gate leaks into the page.
    await expect(page.getByText(/Freezing while ahead/)).toHaveCount(0);
  });

  test("the section rail moves between tracks", async ({ page }) => {
    await page.goto("/academy");

    await page.getByRole("navigation").getByRole("link", { name: "Laning" }).click();
    await expect(page).toHaveURL(/\/academy\/laning$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Laning");
  });
});
