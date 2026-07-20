import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library's auto-cleanup only registers itself when a global `afterEach` exists at import
// time, which is fragile across setup ordering. Registering it explicitly keeps tests independent
// of each other (CLAUDE.md §5.4).
afterEach(() => {
  cleanup();
});
