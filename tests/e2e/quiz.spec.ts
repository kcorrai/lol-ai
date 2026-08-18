import { test, expect } from "@playwright/test";

// The quiz is public by design — an anonymous player is the whole top of the
// funnel — so every test here runs with no auth state.
test.use({ storageState: { cookies: [], origins: [] } });

const MODES = ["Classic", "Ability", "Splash", "Lore", "Quote", "Emoji", "Build", "Impostor"];

test.describe("LaneIQ Daily", () => {
  test("is playable without logging in", async ({ page }) => {
    await page.goto("/quiz");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "LaneIQ Daily" })).toBeVisible();
    for (const mode of MODES) {
      await expect(page.getByRole("tab", { name: mode, exact: true })).toBeVisible();
    }
  });

  test("grades a Classic guess across all eight columns", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByLabel("Guess a champion").fill("Teemo");
    await page.getByLabel("Guess a champion").press("Enter");

    const row = page.getByRole("row").filter({ hasText: "Teemo" });
    await expect(row).toBeVisible();
    // Guess cell plus the eight compared columns.
    await expect(row.locator("td")).toHaveCount(9);
  });

  test("refuses a name that is not a champion", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByLabel("Guess a champion").fill("Gandalf");
    await page.getByLabel("Guess a champion").press("Enter");
    // Scoped to the paragraph: Next's own route announcer is also role="alert".
    await expect(page.locator('p[role="alert"]')).toContainText(/not a champion/i);
  });

  test("keeps the board across a reload", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByLabel("Guess a champion").fill("Garen");
    await page.getByLabel("Guess a champion").press("Enter");
    await expect(page.getByRole("row").filter({ hasText: "Garen" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("row").filter({ hasText: "Garen" })).toBeVisible();
  });

  test("serves the splash art without naming the champion in the URL", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByRole("tab", { name: "Splash", exact: true }).click();

    const image = page.getByRole("img", { name: /mystery splash art/i });
    await expect(image).toBeVisible();
    // The whole point of the proxy: Data Dragon would have put the answer in the
    // path, so a src carrying a champion name means the puzzle is solvable from
    // the network tab.
    await expect(image).toHaveAttribute("src", "/api/quiz/asset/splash");
  });

  test("reveals the answer only once the player gives up", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByRole("tab", { name: "Emoji", exact: true }).click();

    await expect(page.getByText(/The answer was/i)).toBeHidden();
    await page.getByRole("button", { name: "Give up" }).click();
    await expect(page.getByText(/The answer was/i)).toBeVisible();
  });

  test("offers a share grid that names no champion", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByRole("tab", { name: "Lore", exact: true }).click();
    await page.getByRole("button", { name: "Give up" }).click();

    const share = page.locator("pre").first();
    await expect(share).toContainText(/LaneIQ Daily #\d+/);
    await expect(share).toContainText("laneiq.gg/quiz");

    // Whatever today's answer is, it must not be in the block a player pastes.
    const answer = await page.locator("p.font-display").last().innerText();
    await expect(share).not.toContainText(answer);
  });

  test("hands out one more rung of the build with each miss", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByRole("tab", { name: "Build", exact: true }).click();

    // The core items are the opening prompt; everything below is still locked.
    const row = (name: string) => page.getByRole("group", { name, exact: true });
    await expect(row("Core").getByRole("img")).not.toHaveCount(0);
    await expect(row("Boots").getByRole("img")).toHaveCount(0);

    await page.getByLabel("Guess a champion").fill("Teemo");
    await page.getByLabel("Guess a champion").press("Enter");

    // One miss buys the boots — and nothing beyond them.
    await expect(row("Boots").getByRole("img")).toHaveCount(1);
    await expect(row("Summoners").getByRole("img")).toHaveCount(0);
  });

  test("puts eight champions on the impostor board and keeps the answer quiet", async ({
    page,
  }) => {
    await page.goto("/quiz");
    await page.getByRole("tab", { name: "Impostor", exact: true }).click();

    await expect(page.getByText(/Seven of these eight champions share something/i)).toBeVisible();
    await expect(page.getByText(/What they share arrives after three misses/i)).toBeVisible();

    const board = page.locator("div.grid-cols-4 > button");
    await expect(board).toHaveCount(8);

    // A wrong pick is a miss, not a reveal.
    await board.first().click();
    await expect(page.getByText(/The answer was/i)).toBeHidden();
  });

  test("prompts anonymous visitors to sign in for the personal quiz", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByRole("tab", { name: "Yours", exact: true }).click();
    await expect(page.getByRole("link", { name: /Sign in to play/i })).toBeVisible();
  });

  test("practice mode runs off the daily puzzle", async ({ page }) => {
    await page.goto("/quiz");
    await expect(page.getByText(/^#\d+$/)).toBeVisible();

    await page.getByRole("button", { name: /Practice/i }).click();
    await expect(page.getByText("PRACTICE")).toBeVisible();

    await page.getByRole("button", { name: /Back to today/i }).click();
    await expect(page.getByText(/^#\d+$/)).toBeVisible();
  });

  test("shows the leaderboard, ranked on play rather than tenure", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByRole("tab", { name: "Board", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
    await expect(page.getByText(/most modes solved first, then fewest guesses/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Today" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await page.getByRole("button", { name: "This week" }).click();
    await expect(page.getByRole("button", { name: "This week" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("does not accept a score the player did not earn", async ({ request }) => {
    // The client used to report its own guess count when a mode finished, which
    // is a leaderboard position anyone could claim. Guesses are counted in
    // /api/quiz/guess now, and there is no endpoint left that takes a total.
    const res = await request.post("/api/quiz/progress", {
      data: { mode: "classic", guessCount: 1, solved: true },
    });
    expect(res.status()).toBe(405);
  });

  test("rejects a leaderboard period it does not have", async ({ request }) => {
    const res = await request.get("/api/quiz/leaderboard?period=alltime");
    expect(res.status()).toBe(422);
  });

  test("is linked from the tools hub", async ({ page }) => {
    await page.goto("/tools");
    await page.getByRole("link", { name: /LaneIQ Daily/ }).first().click();
    await expect(page).toHaveURL(/\/quiz/);
  });
});
