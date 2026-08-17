import { defineConfig, devices } from "@playwright/test";

// E2E tests run on port 3001 to avoid clashing with the dev server on 3000.
// Set E2E_DATABASE_URL to a separate test DB; falls back to DATABASE_URL for
// local development where a single DB is acceptable.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /\.spec\.ts$|\.setup\.ts$/,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Sequential execution: all tests share DB state seeded in global-setup
  workers: 1,
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

    // The esports section is public and stateless — a cache over a feed, with
    // no seeded row behind any of it, so it needs neither auth nor setup.
    {
      name: "esports",
      testMatch: /esports\.spec\.ts$/,
      // The hub aggregates a whole split's worth of games to build the pro
      // sample, and under `next dev` each route pays its first compile on the
      // request that reaches it. Both are one-off, and neither is worth
      // reporting as a failure at the 30s default.
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

    // Smoke tests requiring authentication — depend on setup project
    {
      name: "smoke",
      testMatch: /\/(riot|coaching|share|guided-onboarding|esports-follows)\.spec\.ts$/,
      dependencies: ["setup"],
      // Following a team walks the same feed the esports project does, and pays
      // the same first-compile cost under `next dev`.
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
    },
  ],

  webServer: {
    command: "next dev -p 3001",
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
      // Prevent Sentry from emitting noise during tests
      NEXT_PUBLIC_SENTRY_DSN: "",
    },
  },
});
