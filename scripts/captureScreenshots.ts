import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { chromium, type Browser, type Page } from "@playwright/test";

/**
 * Captures the landing page's product imagery from the running app.
 *
 * The landing page used to illustrate itself with CSS mock-ups, and the three
 * JPEGs that predated them were shot on the pre-rebrand navy-and-gold design —
 * putting either on the page sells something that is not what a visitor gets.
 * These are the real screens.
 *
 * It is a script rather than a one-off because the shots go stale: the patch
 * number is burnt into the tier list, and any redesign invalidates all of them.
 * Re-run it instead of retouching a PNG.
 *
 *   npm run dev                    # in another terminal, port 3001
 *   npm run capture:screenshots
 *
 * Authenticated shots sign in as the dev user from `prisma/seed.ts` and cache the
 * session, so the sign-in happens once and never again while the cache lives.
 * That restraint is the point: five failed logins lock the account for fifteen
 * minutes and the lockout answers 200, so a script that retried on failure would
 * look like it was working while locking everyone else out.
 *
 * If the app has no match data the logged-in shots are pictures of empty states.
 * Run `npx prisma db seed` first.
 */

const BASE = process.env.CAPTURE_BASE_URL ?? "http://localhost:3001";
const OUT = resolve(process.cwd(), "public/screenshots");

/**
 * Its own session file, not the e2e suite's `user.json`: that one belongs to
 * `e2e-smoke@lolai.test` and the setup project rewrites it. This uses the dev
 * user `prisma/seed.ts` documents, and the directory is already gitignored.
 */
const AUTH = resolve(process.cwd(), "tests/e2e/.auth/capture.json");
const DEV_USER = { email: "dev@lolai.test", password: "test1234" };

// JPEG, not PNG: `.gitignore` excludes `*.png`, so a PNG capture would be
// invisible to git and the page would 404 for everyone but the machine that
// shot it. Quality 82 is where these stop shrinking without visible banding in
// the dark UI.
const JPEG_QUALITY = 82;

/** 16:10 at a laptop width — the aspect the landing cards are laid out for. */
const VIEWPORT = { width: 1440, height: 900 };

interface Target {
  /** Output filename, without extension. */
  name: string;
  path: string;
  /** Needs the stored session. */
  auth?: boolean;
  /** Scroll this into view before shooting, so the interesting part is framed. */
  focus?: string;
  /** Extra settle time in ms for pages that animate on entry. */
  settle?: number;
}

/**
 * Deep links, not tool landings.
 *
 * `/tools/counter-picker` and `/tools/draft-analyzer` open on an empty form —
 * "Select a champion above to see its counters" — which photographs as a product
 * that does nothing. The per-champion routes render the same tool already full
 * of real data, so those are what gets shot.
 *
 * Absent on purpose:
 * - Academy: its visual language is being rebuilt (LA-44), so a shot would be
 *   stale before it shipped.
 * - /coaching and /creator: both are empty states on a fresh account — no report
 *   has been generated and creator mode is off. Generating a real report costs an
 *   AI call, so those two keep their drawn illustrations until someone decides to
 *   spend it.
 */
const TARGETS: readonly Target[] = [
  { name: "tier-list", path: "/tools/tier-list" },
  { name: "counters", path: "/counters/Darius" },
  { name: "builds", path: "/builds/Ahri" },
  // The analyzer reads both comps off the query string, so it can be shot with
  // a real 5v5 already graded instead of ten empty slots.
  {
    name: "draft-analyzer",
    path:
      "/tools/draft-analyzer?blue=Ornn,Vi,Orianna,Kaisa,Nautilus" +
      "&red=Aatrox,Khazix,Ahri,Jinx,Thresh",
  },
  { name: "aram", path: "/aram/tier-list" },
  { name: "meta", path: "/meta" },
  { name: "quiz", path: "/quiz", settle: 1200 },
  { name: "esports", path: "/esports" },
  { name: "dashboard", path: "/dashboard", auth: true, settle: 1500 },
];

async function shoot(page: Page, target: Target): Promise<string> {
  const res = await page.goto(`${BASE}${target.path}`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  });
  const status = res?.status() ?? 0;
  if (status >= 400) return `HTTP ${status}`;

  // Landing sections animate in on scroll; the app's own pages mostly do not,
  // but champion art still streams in from Data Dragon after networkidle.
  await page.waitForTimeout(target.settle ?? 700);

  if (target.focus) {
    const el = page.locator(target.focus).first();
    if (await el.count()) await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }

  await page.screenshot({
    path: resolve(OUT, `${target.name}.jpg`),
    type: "jpeg",
    quality: JPEG_QUALITY,
    scale: "css",
  });

  // A page that redirected to /login produced a real screenshot of the wrong
  // thing, which is the one failure that would otherwise pass silently.
  const landed = new URL(page.url()).pathname;
  if (landed.startsWith("/login")) return "redirected to /login";
  return "ok";
}

/**
 * Signs in once and caches the session.
 *
 * Deliberately the only place this script authenticates, and only when the
 * cache is missing: consecutive failed dev logins trip the account lockout, and
 * the lockout answers 200 — so a retry loop here would look like it was working
 * while quietly locking the account for everyone else.
 */
async function signIn(browser: Browser): Promise<void> {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 120_000 });

  // The page mints its CSRF cookie from its own /api/auth calls on mount, and a
  // script can type before they land — the form then posts one response's token
  // against another's cookie and reports "your login session expired". A person
  // cannot fill a form this fast; this wait is what makes the script one.
  await page.waitForTimeout(2_500);

  await page.fill("#email", DEV_USER.email);
  await page.fill("#password", DEV_USER.password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL("**/dashboard", { timeout: 30_000 });
    await dismissOnboarding(page);
    await context.storageState({ path: AUTH });
    await context.close();
    return;
  } catch {
    // Fall through to the one retry below.
  }

  // A CSRF mismatch is rejected before `authorize` ever runs, so it costs no
  // brute-force attempt and is safe to retry exactly once. Anything else — bad
  // credentials, a lockout — is not, so the retry is gated on that message.
  const csrf = page.getByText(/login session expired/i);
  if (!(await csrf.count())) {
    await context.close();
    throw new Error("sign-in did not reach /dashboard and did not report a CSRF miss");
  }

  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 60_000 });
  await dismissOnboarding(page);

  await context.storageState({ path: AUTH });
  await context.close();
}

/**
 * Closes the first-run guided tour.
 *
 * It opens over every authenticated page and dims everything behind it, so
 * without this every logged-in shot is a picture of the tour. Dismissing writes
 * through to the database (`useGuidedOnboarding`), so once is enough — for this
 * user, permanently.
 */
async function dismissOnboarding(page: Page): Promise<void> {
  const skip = page.getByRole("button", { name: /skip setup/i });
  try {
    await skip.waitFor({ state: "visible", timeout: 8_000 });
    await skip.click();
    await skip.waitFor({ state: "detached", timeout: 8_000 });
  } catch {
    // Already dismissed on a previous run — nothing to close.
  }
}

async function run(): Promise<void> {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

  const browser: Browser = await chromium.launch();

  if (TARGETS.some((t) => t.auth) && !existsSync(AUTH)) {
    console.log(`No cached session — signing in as ${DEV_USER.email} once…`);
    try {
      await signIn(browser);
      console.log("  ✓ session cached\n");
    } catch (err) {
      console.error(
        `  ✗ sign-in failed: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}\n` +
          `    Run \`npx prisma db seed\` to create the dev user, then try again.\n` +
          `    Do not re-run blindly — repeated attempts lock the account.\n`
      );
      await browser.close();
      process.exitCode = 1;
      return;
    }
  }

  const results: Array<[string, string]> = [];

  for (const target of TARGETS) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      storageState: target.auth ? AUTH : undefined,
    });
    const page = await context.newPage();
    try {
      results.push([target.name, await shoot(page, target)]);
    } catch (err) {
      results.push([target.name, `failed: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`]);
    }
    await context.close();
  }

  await browser.close();

  console.log(`\nCaptured into ${OUT}\n`);
  for (const [name, status] of results) {
    console.log(`  ${status === "ok" ? "✓" : "✗"} ${name.padEnd(16)} ${status}`);
  }
  const bad = results.filter(([, s]) => s !== "ok");
  if (bad.length) {
    console.log(`\n${bad.length} of ${results.length} need a look before they go on the page.`);
    process.exitCode = 1;
  }
}

void run();
