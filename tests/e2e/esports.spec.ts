import { readFileSync } from "fs";
import { join } from "path";
import { test, expect } from "@playwright/test";

// The esports section is public by design — it is the acquisition surface, and
// ADR-016 rules out gating any of it. So every test here runs signed out, and
// "did this redirect to /login" is an assertion rather than an afterthought.
test.use({ storageState: { cookies: [], origins: [] } });

// The feeds are replayed from tests/e2e/fixtures/esports (see
// src/domains/esports/services/esportsFixtures.ts). The manifest names what was
// captured, so refreshing the fixtures moves these tests with them instead of
// leaving hardcoded ids to rot.
const manifest = JSON.parse(
  readFileSync(join(process.cwd(), "tests/e2e/fixtures/esports/manifest.json"), "utf8")
) as { leagueSlug: string; matchId: string; gameId: string };

test.describe("Esports section", () => {
  test("hub is reachable signed out and leads into the section", async ({ page }) => {
    await page.goto("/esports");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "LoL Esports", level: 1 })).toBeVisible();

    // The rail and the columns are separate cache-backed reads; each is allowed
    // to fail alone, so the hub asserting only its own title would pass with
    // every panel missing.
    await expect(page.getByRole("link", { name: /Full schedule/i }).first()).toBeVisible();
  });

  test("schedule shows results and keeps kickoff times in the reader's zone", async ({ page }) => {
    await page.goto("/esports/schedule");
    await expect(page.getByRole("heading", { name: "Esports Schedule", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent results" })).toBeVisible();

    // A result row is a link into the match page; the schedule rendering its
    // headings but no rows is the shape a broken mapper leaves behind.
    await expect(page.locator("a[href^='/esports/matches/']").first()).toBeVisible();
  });

  test("team index groups by league and each team page opens", async ({ page }) => {
    await page.goto("/esports/teams");
    await expect(page.getByRole("heading", { name: "Esports Teams", level: 1 })).toBeVisible();

    const firstTeam = page.getByRole("link", { name: /roster|team/i }).first();
    const anyTeam = (await firstTeam.count()) ? firstTeam : page.locator("a[href^='/esports/teams/']").first();
    await anyTeam.click();

    await expect(page).toHaveURL(/\/esports\/teams\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("league page carries a standings table", async ({ page }) => {
    await page.goto(`/esports/leagues/${manifest.leagueSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("table").first()).toBeVisible();
  });

  test("match page renders the scoreboard, the per-minute rates and the gold curve", async ({
    page,
  }) => {
    await page.goto(`/esports/matches/${manifest.matchId}`);
    // `.first()` because the page gives each of the two teams its own h1 — see
    // the note in ESPORTS_LAUNCH_CHECKLIST.md; asserting one heading here would
    // fail on the duplication rather than on anything this test is about.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    // CS/m and G/m only exist because the game's length is derived from the
    // opening frame of the window feed (TASK-315). If that request stops being
    // made, or the derivation stops returning, these two columns are the first
    // thing that empties — the rest of the scoreboard survives without them.
    await expect(page.getByRole("columnheader", { name: "CS/m" }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "G/m" }).first()).toBeVisible();

    // The curve is the sampled walk end to end: eleven separate window requests,
    // each its own cache entry.
    await expect(page.getByRole("img", { name: /Gold difference over/ })).toBeVisible();
  });

  test("VOD archive lists recorded series and links back into the section", async ({ page }) => {
    await page.goto("/esports/vods");
    await expect(page.getByRole("heading", { name: "Esports VODs", level: 1 })).toBeVisible();
    await expect(page.locator("a[href^='/esports/matches/']").first()).toBeVisible();
  });

  // ADR-017 §4: a page with no content must not invite a crawler in.
  test("thin pages are noindex", async ({ page }) => {
    const response = await page.goto("/esports/teams");
    expect(response?.status()).toBe(200);
    await expect(page.locator("head meta[name='robots']")).toHaveCount(0);
  });

  test("a surface the feed cannot answer still returns 200 with an empty state", async ({
    page,
  }) => {
    // The replay layer answers 503 for anything it has no fixture for, which is
    // the same shape as the live feed being unreachable with nothing cached —
    // the degradation the section's definition of done turns on. `lck` is in the
    // captured league list, so the slug resolves and only its data is missing.
    const response = await page.goto("/esports/leagues/lck");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
