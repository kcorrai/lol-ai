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
