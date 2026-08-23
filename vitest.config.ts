import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Two projects rather than one: node tests must not pay for a DOM, and component tests cannot run
// without one. Vitest 4 removed `environmentMatchGlobs`, so projects are the supported way to run
// both environments from a single `vitest run`.
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      // `app/` and `.tsx` were previously outside the denominator, which made the reported number
      // describe a subset of the application rather than the application.
      include: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "src/types/**", "src/test/**", "**/*.d.ts"],
      thresholds: {
        // A ratchet, not a target. Set just under the measured 18% so CI catches coverage going
        // *backwards* without pretending the current number is acceptable. Raise it as it climbs.
        statements: 17,
        branches: 13,
        functions: 14,
        lines: 17,

        // Files where coverage was built deliberately and a drop means a real defence was removed.
        // These are all at 100% today (TASK-263/265/266/267/276), so anything less is a regression
        // rather than a shortfall — which is why they are pinned per file instead of per directory.
        "src/lib/api/withAdminAuth.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/lib/auth/authorization.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/lib/auth/planLimits.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/lib/auth/totpService.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/lib/db/userLock.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
        "src/lib/lemonsqueezy/lsWebhookVerify.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/lib/subscription/subscriptionService.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        // The marketplace's money and its state machine. A drop here means a
        // defence was removed from the part of the section that decides who
        // gets paid (LA-19).
        "src/domains/marketplace/policy.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/domains/marketplace/transitions.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/domains/marketplace/rating.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/domains/marketplace/redact.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "node",
          globals: true,
          environment: "node",
          include: ["src/**/*.test.ts", "app/**/*.test.ts"],
          // Exclude Playwright E2E tests — they use @playwright/test, not vitest
          exclude: ["tests/e2e/**", "node_modules/**"],
        },
      },
      {
        plugins: [tsconfigPaths()],
        // tsconfig sets `jsx: "preserve"` because Next.js does its own transform. Vitest has no
        // Next.js compiler in front of it, so JSX has to be transformed here or it reaches the
        // parser untouched.
        oxc: { jsx: { runtime: "automatic", importSource: "react" } },
        test: {
          name: "dom",
          globals: true,
          environment: "jsdom",
          include: ["src/**/*.test.tsx", "app/**/*.test.tsx"],
          exclude: ["tests/e2e/**", "node_modules/**"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
