import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

// Two browsers, one board. The draft room is public, so this suite needs no
// auth state — which also means it exercises exactly what a real scrim does:
// two people who have never logged in, sharing a link.

interface CreatedDraft {
  code: string;
  blueToken: string;
  redToken: string;
}

async function createDraft(request: APIRequestContext): Promise<CreatedDraft> {
  const res = await request.post("/api/draft", {
    data: { team1Name: "Blue Squad", team2Name: "Red Squad", timerSeconds: 90 },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data as CreatedDraft;
}

async function join(page: Page, draft: CreatedDraft, token: string): Promise<void> {
  await page.goto(`/draft/${draft.code}?as=${token}`);
  await expect(page.getByRole("heading", { name: /Blue Squad/ })).toBeVisible();
}

async function readyUp(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Ready", exact: true }).click();
}

/** Clicks a champion and locks it in — selection and commit are separate. */
async function lockIn(page: Page, champion: string): Promise<void> {
  await page.getByTitle(champion, { exact: true }).click();
  await page.getByRole("button", { name: "Lock in" }).click();
}

test.describe("live draft room", () => {
  test("two drafters share one board", async ({ browser, request }) => {
    const draft = await createDraft(request);
    const blue = await (await browser.newContext()).newPage();
    const red = await (await browser.newContext()).newPage();

    await join(blue, draft, draft.blueToken);
    await join(red, draft, draft.redToken);

    // The token is claimed into sessionStorage and stripped from the URL, so a
    // screenshot of the room never carries a drafter seat.
    await expect(blue).toHaveURL(new RegExp(`/draft/${draft.code}$`));

    await readyUp(blue);
    await readyUp(red);

    // Blue bans first. Red sees it within a poll interval without acting.
    await lockIn(blue, "Ahri");
    await expect(red.getByText(/Red Squad — ban 1/)).toBeVisible({ timeout: 5_000 });
    await expect(red.getByTitle("Taken this game")).toBeVisible();

    // Red bans; blue's board follows.
    await lockIn(red, "Zed");
    await expect(blue.getByText(/Blue Squad — ban 2/)).toBeVisible({ timeout: 5_000 });
  });

  test("a drafter cannot act out of turn", async ({ browser, request }) => {
    const draft = await createDraft(request);
    const blue = await (await browser.newContext()).newPage();
    const red = await (await browser.newContext()).newPage();

    await join(blue, draft, draft.blueToken);
    await join(red, draft, draft.redToken);
    await readyUp(blue);
    await readyUp(red);

    // It is blue's turn, so red has no Lock in button at all.
    await expect(blue.getByRole("button", { name: "Lock in" })).toBeVisible();
    await expect(red.getByRole("button", { name: "Lock in" })).toHaveCount(0);
  });

  test("a spectator watches without a seat", async ({ browser, request }) => {
    const draft = await createDraft(request);
    const blue = await (await browser.newContext()).newPage();
    const watcher = await (await browser.newContext()).newPage();

    await join(blue, draft, draft.blueToken);
    await watcher.goto(`/draft/${draft.code}`);

    await expect(watcher.getByText("Spectator")).toBeVisible();
    await expect(watcher.getByRole("button", { name: "Ready", exact: true })).toHaveCount(0);
  });

  test("a drafter can take back their own last lock, but not the other side's", async ({
    browser,
    request,
  }) => {
    const draft = await createDraft(request);
    const blue = await (await browser.newContext()).newPage();
    const red = await (await browser.newContext()).newPage();

    await join(blue, draft, draft.blueToken);
    await join(red, draft, draft.redToken);
    await readyUp(blue);
    await readyUp(red);

    await lockIn(blue, "Ahri");
    // Red never gets the offer — the last action is not theirs.
    await expect(red.getByRole("button", { name: /Undo/ })).toHaveCount(0);

    await expect(blue.getByRole("button", { name: /Undo ban/ })).toBeVisible();
    await blue.getByRole("button", { name: /Undo ban/ }).click();
    await expect(blue.getByRole("button", { name: "Lock in" })).toBeVisible();
  });
});
