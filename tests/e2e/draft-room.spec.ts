import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

// Two browsers, one board. The draft room is public, so this suite needs no
// auth state — which also means it exercises exactly what a real scrim does:
// two people who have never logged in, sharing a link.

interface CreatedDraft {
  code: string;
  blueToken: string;
  redToken: string;
}

// Draft creation is rate limited to 5 per 10 minutes per IP (CREATE_LIMIT), and
// the limiter buckets on whatever `getIp` reads. Without a fresh bucket per
// draft the fourth test in a run — or any second run inside the window — gets a
// 429 and the suite fails for a reason that has nothing to do with the draft.
let draftBucket = 0;
function freshIpBucket(): string {
  draftBucket += 1;
  return `e2e-draft-${process.pid}-${draftBucket}`;
}

async function createDraft(request: APIRequestContext): Promise<CreatedDraft> {
  const res = await request.post("/api/draft", {
    headers: { "x-forwarded-for": freshIpBucket() },
    data: { team1Name: "Blue Squad", team2Name: "Red Squad", timerSeconds: 90 },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data as CreatedDraft;
}

async function join(page: Page, draft: CreatedDraft, token: string): Promise<void> {
  await page.goto(`/draft/${draft.code}?as=${token}`);
  await expect(page.getByRole("heading", { name: /Blue Squad/ })).toBeVisible();
}

/**
 * Both drafters are two people at two screens, each looking at their own. The
 * room stops polling while a tab is hidden (ADR-016, `useDraftSync`), and two
 * pages in one Chromium mean only the front one is visible — so a page has to
 * be brought forward before it either acts or is read, exactly as attention
 * moves between the two real players.
 */
async function look(page: Page): Promise<void> {
  await page.bringToFront();
}

async function readyUp(page: Page): Promise<void> {
  await look(page);
  await page.getByRole("button", { name: "Ready", exact: true }).click();
}

/** The commit button, whatever it currently says. With nothing selected it
 *  reads "Select a champion"; it is absent entirely when it is not your turn. */
const COMMIT_BUTTON = /^(Select a champion|Lock (ban|pick)|Locking…)$/;

/** Clicks a champion and locks it in — selection and commit are separate.
 *  The commit button names the step it commits: "Lock ban" or "Lock pick".
 *
 *  Waiting for the commit button first is not padding: the grid ignores clicks
 *  when it is not your turn, so selecting before this page's poll has caught up
 *  to the draft starting is a click that lands and does nothing. */
async function lockIn(page: Page, champion: string): Promise<void> {
  await look(page);
  await expect(page.getByRole("button", { name: COMMIT_BUTTON })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTitle(champion, { exact: true }).click();
  await page.getByRole("button", { name: /^Lock (ban|pick)$/ }).click();
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
    await look(red);
    await expect(red.getByText(/Red Squad to ban/)).toBeVisible({ timeout: 10_000 });
    await expect(red.getByTitle("Taken this game")).toBeVisible();

    // Red bans; blue's board follows.
    await lockIn(red, "Zed");
    await look(blue);
    await expect(blue.getByText(/Blue Squad to ban/)).toBeVisible({ timeout: 10_000 });
  });

  test("a drafter cannot act out of turn", async ({ browser, request }) => {
    const draft = await createDraft(request);
    const blue = await (await browser.newContext()).newPage();
    const red = await (await browser.newContext()).newPage();

    await join(blue, draft, draft.blueToken);
    await join(red, draft, draft.redToken);
    await readyUp(blue);
    await readyUp(red);

    // It is blue's turn, so red has no commit button at all.
    await look(blue);
    await expect(blue.getByRole("button", { name: COMMIT_BUTTON })).toBeVisible({
      timeout: 10_000,
    });

    await look(red);
    // Read red only once it has caught up to the draft actually being under
    // way, otherwise "no commit button" would also pass on a stale lobby.
    await expect(red.getByText(/Blue Squad to ban/)).toBeVisible({ timeout: 10_000 });
    await expect(red.getByRole("button", { name: COMMIT_BUTTON })).toHaveCount(0);
  });

  test("a spectator watches without a seat", async ({ browser, request }) => {
    const draft = await createDraft(request);
    const blue = await (await browser.newContext()).newPage();
    const watcher = await (await browser.newContext()).newPage();

    await join(blue, draft, draft.blueToken);
    await look(watcher);
    await watcher.goto(`/draft/${draft.code}`);

    // Exact: the room also offers a "Copy spectator link" button, and a loose
    // match would pass on that without the seat ever saying what it is.
    await expect(watcher.getByText("Spectator", { exact: true })).toBeVisible();
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
    await look(red);
    await expect(red.getByText(/Red Squad to ban/)).toBeVisible({ timeout: 10_000 });
    await expect(red.getByRole("button", { name: /Undo/ })).toHaveCount(0);

    await look(blue);
    await expect(blue.getByRole("button", { name: /Undo ban/ })).toBeVisible({ timeout: 10_000 });
    await blue.getByRole("button", { name: /Undo ban/ }).click();
    await expect(blue.getByRole("button", { name: COMMIT_BUTTON })).toBeVisible();
  });
});
