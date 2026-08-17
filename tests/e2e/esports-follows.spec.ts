import { readFileSync } from "fs";
import { join } from "path";
import { test, expect } from "@playwright/test";

// TASK-313. The one part of the esports section that is not public and not
// stateless, so unlike esports.spec.ts this runs with the seeded session.
const manifest = JSON.parse(
  readFileSync(join(process.cwd(), "tests/e2e/fixtures/esports/manifest.json"), "utf8")
) as { leagueSlug: string };

/** A team the captured fixtures actually resolve. */
function anyTeam(): { slug: string; name: string } {
  const teams = JSON.parse(
    readFileSync(join(process.cwd(), "tests/e2e/fixtures/esports/getTeams.json"), "utf8")
  ) as { data: { teams: { slug: string; name: string }[] } };
  return teams.data.teams[0];
}

test.describe("Following a team", () => {
  test("follows from the team page, shows on the hub, and unfollows again", async ({ page }) => {
    const { slug } = anyTeam();

    await page.goto(`/esports/teams/${slug}`);
    const follow = page.getByRole("button", { name: /^Follow/ });
    await expect(follow).toBeVisible();

    await follow.click();

    // The same button, now pressed — not a second button appearing beside it.
    const following = page.getByRole("button", { name: /^Following/ });
    await expect(following).toBeVisible();
    await expect(following).toHaveAttribute("aria-pressed", "true");

    // It survives a reload, which is the difference between this and a
    // client-only toggle: the row is in Postgres.
    await page.reload();
    await expect(page.getByRole("button", { name: /^Following/ })).toBeVisible();

    // And it reaches the hub rail, which is the point of following at all.
    // By href, not by name: the rail shows the team's display name, and the
    // stored copy of that name is exactly what this is checking travelled.
    await page.goto("/esports");
    await expect(page.locator(`a[href="/esports/teams/${slug}"]`).first()).toBeVisible();

    await page.goto(`/esports/teams/${slug}`);
    await page.getByRole("button", { name: /^Following/ }).click();
    // On `aria-pressed`, not on the label: the accessible name carries the team
    // name for screen readers, so "Following" and "Follow" both start the same
    // way and only the pressed state actually distinguishes them.
    await expect(page.getByRole("button", { name: /^Follow/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    // The panel renders nothing at all for a reader following nobody, rather
    // than an empty box on a page most people reach from a search result.
    await page.goto("/esports");
    await expect(page.getByText("// your teams")).toHaveCount(0);
  });

  test("the API refuses a team the feed does not publish", async ({ request }) => {
    const response = await request.post("/api/esports/follows", {
      data: { slug: "a-team-that-does-not-exist" },
    });
    expect(response.status()).toBe(404);
  });

  test("the API rejects a request with no slug", async ({ request }) => {
    const response = await request.post("/api/esports/follows", { data: {} });
    expect(response.status()).toBe(422);
  });

  test("the league the fixtures were captured from still resolves", async ({ page }) => {
    // Guards the spec above: if the captured league goes, `anyTeamSlug` starts
    // returning a team with no page and the follow test fails for the wrong reason.
    const response = await page.goto(`/esports/leagues/${manifest.leagueSlug}`);
    expect(response?.status()).toBe(200);
  });
});
