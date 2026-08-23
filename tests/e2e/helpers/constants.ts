import { join } from "path";
import { e2eMockPuuid } from "../../../src/lib/riot/e2eFixtures";

// Test user seeded by global-setup.ts — known credentials for all authenticated tests
export const E2E_USER = {
  email: "e2e-smoke@lolai.test",
  password: "E2e-Sm0ke-Pass!",
  name: "E2E Smoke",
} as const;

// Riot account used for connect tests.
// The mock PUUID comes from the same helper the fixtures answer with, rather than a second copy
// of the rule — the two were written out separately and nothing tied them together (LA-71).
export const E2E_RIOT_CONNECT = {
  gameName: "E2ESmoke",
  tagLine: "E2E",
  region: "euw1",
  get mockPuuid() {
    return e2eMockPuuid(this.gameName);
  },
} as const;

// Pre-seeded riot account (already connected before tests run)
export const E2E_RIOT_PRE = {
  gameName: "E2ESmokeLinked",
  tagLine: "PRE",
  region: "euw1",
  get mockPuuid() {
    return e2eMockPuuid(this.gameName);
  },
} as const;

export const E2E_SHARE_TOKEN = "e2e-share-tok-000000000000000000000000";

// Every seeded match id starts with this, so the next run can find and clear
// them without owning them through a user row.
export const E2E_MATCH_PREFIX = "E2E_SMOKE_";

// Paths for cross-test state files
export const AUTH_FILE = join(process.cwd(), "tests/e2e/.auth/user.json");
export const STATE_FILE = join(process.cwd(), "tests/e2e/.auth/state.json");
