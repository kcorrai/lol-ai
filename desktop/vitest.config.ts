import { defineConfig } from "vitest/config";
import { aliases, webTreeFallback } from "./aliases.ts";

export default defineConfig({
  // The same resolution the app builds with (ADR-043). Sharing it rather than repeating it
  // is what stops a module being tested against the real Next package and shipped against
  // the shim that replaces it.
  plugins: [webTreeFallback()],
  resolve: {
    alias: aliases,
    dedupe: ["react", "react-dom", "@tanstack/react-query", "zustand", "lucide-react"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
