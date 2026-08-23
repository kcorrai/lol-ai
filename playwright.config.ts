import { defineConfig, devices } from "@playwright/test";
import { loadE2EEnv } from "./tests/e2e/helpers/env";

// Before anything reads process.env: the config, global-setup and the helpers
// are plain Node, so nothing has loaded .env.local for them the way the dev
// server loads it for itself.
loadE2EEnv();

// E2E runs on 3002. It used to be 3001 — the same port `npm run dev` uses — and
// because `reuseExistingServer` is on outside CI, a suite started while a dev
// server was up silently bound to *that* server instead. It has none of the E2E
// env below (no `E2E_MOCK`, a different `NEXTAUTH_URL`), so half the suite fails
// on a config nobody changed. A port of its own removes the whole class.
// Set E2E_DATABASE_URL to a separate test DB; falls back to DATABASE_URL for
// local development where a single DB is acceptable.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3002";

// The server has to come up on the port the tests are pointed at. Hardcoding
// the port here while `baseURL` follows the override means a run on another port
// silently reuses whatever is already listening — which is how a suite ends up
// testing a different checkout, or failing to log in because that server's
// NEXTAUTH_URL names a third port.
const PORT = new URL(BASE_URL).port || "3002";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /\.spec\.ts$|\.setup\.ts$/,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Sequential execution: all tests share DB state seeded in global-setup
  workers: 1,
  // Sized for the local run, where `next dev` compiles a route on the request that reaches it
  // first — tens of seconds for the heavier pages. Playwright's 30s default is a budget, not an
  // assertion, and leaving it there means whichever spec touches a route first fails on the
  // compile rather than on the product. Individual expects keep their own tight budgets, so a
  // real hang is still reported by the assertion that is actually waiting. CI serves a compiled
  // app and pays none of this, so the headroom is only ever unused there.
  timeout: 90_000,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },

  // Module-level global setup runs before the webServer starts.
  // DB seeding only — no browser interaction here.
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",

  projects: [
    // Auth state setup — runs AFTER webServer starts (it's a Playwright test project)
    // Logs in with the seeded user and saves cookies to .auth/user.json
    {
      name: "setup",
      testMatch: /auth-setup\.setup\.ts$/,
      // First past the post: under `next dev` locally this is what pays the compile for /login
      // and /dashboard, and every other project waits behind it.
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },

    // Auth flow tests — register/login/logout — no pre-saved auth state
    {
      name: "auth",
      testMatch: /auth\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },

    // Public free tools — no auth, no setup dependency
    {
      name: "tools",
      testMatch: /tools\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },

    // The daily quiz is public and needs no seeded row: its puzzles are derived
    // from the UTC date and a committed dataset, so there is nothing to set up.
    {
      name: "quiz",
      testMatch: /quiz\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },

    // The esports section is public and stateless — a cache over a feed, with
    // no seeded row behind any of it, so it needs neither auth nor setup.
    {
      name: "esports",
      testMatch: /esports\.spec\.ts$/,
      // The hub aggregates a whole split's worth of games to build the pro sample, and locally
      // each route also pays its first compile on the request that reaches it. Both are one-off,
      // and neither is worth reporting as a failure at the 30s default.
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },

    // The draft room is public too, and deliberately runs with no auth state:
    // two strangers sharing a link is exactly the case it has to survive.
    {
      name: "draft",
      testMatch: /draft-room\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },

    // The Academy is public: lessons are the SEO surface, and the curriculum is code
    // rather than seeded rows, so this needs neither auth nor setup.
    {
      name: "academy",
      testMatch: /academy\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },

    // The marketplace needs the seeded session for the coach side, and drives
    // its own rows through Prisma rather than through an admin UI the seeded
    // user has no access to. The public storefront cases inside it opt out of
    // the stored session with `test.use`.
    {
      name: "marketplace",
      testMatch: /marketplace\.spec\.ts$/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
    },

    // The Streamer Kit spans both sides of the session boundary: the dashboard
    // needs the seeded login, and the overlay and chat endpoints must work with
    // no session at all, since OBS and Nightbot cannot carry one. Both run in
    // one project — `creator-overlay.spec.ts` drops the stored state itself with
    // a file-level `test.use`, which is the assertion rather than a shortcut.
    {
      name: "creator",
      testMatch: /creator(-overlay)?\.spec\.ts$/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
    },

    // Smoke tests requiring authentication — depend on setup project
    {
      name: "smoke",
      testMatch: /\/(riot|coaching|share|guided-onboarding|esports-follows)\.spec\.ts$/,
      dependencies: ["setup"],
      // Following a team walks the same feed the esports project does, and locally pays the
      // same first-compile cost.
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
    },
  ],

  webServer: {
    // CI builds the app and then, until now, threw that build away: this served `next dev`, which
    // compiles each route on the first request that reaches it. Every assertion budget in the
    // suite was really a bet on whether it was the one paying that compile, which is why six full
    // runs produced six different sets of 1-4 failures and none of them repeated (LA-56). `retries`
    // hid it rather than fixing it — a green run only meant the second attempt hit a warm route.
    //
    // Locally it stays `next dev`: there is no build to serve, and reloading beats rebuilding.
    command: process.env.CI ? `next start -p ${PORT}` : `next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      DATABASE_URL: process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
      E2E_MOCK: "true",
      AUTH_SECRET: "e2e-test-secret-not-for-production-xk9z",
      NEXTAUTH_SECRET: "e2e-test-secret-not-for-production-xk9z",
      NEXTAUTH_URL: BASE_URL,
      NEXT_PUBLIC_APP_URL: BASE_URL,
      RIOT_API_KEY: "e2e-fake-riot-api-key",
      CRON_SECRET: "e2e-fake-cron-secret",
      // `next start` runs with NODE_ENV=production, and src/inngest/client.ts refuses to load in
      // production without a signing key — deliberately, because /api/inngest would otherwise
      // accept unsigned requests. Under `next dev` the guard never fired and this was never
      // needed; serving the compiled app makes it a hard requirement. Fake, like every other
      // secret in this block.
      INNGEST_SIGNING_KEY: "signkey-e2e-not-for-production",
      // No shared Redis for a test run. Next loads `.env.local` for the dev
      // server, so without this the suite writes into the real Upstash instance:
      // the brute-force counter, the rate limiters and the caches all live
      // there. The brute-force one is the fatal case — `auth.spec.ts` submits a
      // wrong password on purpose, five of those inside fifteen minutes lock the
      // seeded user out, and every later run fails to log in against state left
      // behind by an earlier one. Blank means the in-memory fallback, which dies
      // with the server.
      KV_REST_API_URL: "",
      KV_REST_API_TOKEN: "",
      KV_URL: "",
      // Prevent Sentry from emitting noise during tests
      NEXT_PUBLIC_SENTRY_DSN: "",
    },
  },
});
