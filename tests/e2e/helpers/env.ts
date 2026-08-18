import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// The Next.js dev server loads `.env` and `.env.local` itself, but global-setup
// and the helpers run in the plain Playwright process, which does not. Without
// this the suite dies before the first test on an empty DATABASE_URL — the
// server under test and the process seeding its database disagreed about what
// environment they were in.
//
// Only fills keys that are not already set, so CI environment variables win.
const ENV_FILES = [".env", ".env.local"];

export function loadE2EEnv(): void {
  for (const filename of ENV_FILES) {
    const filepath = resolve(process.cwd(), filename);
    if (!existsSync(filepath)) continue;

    for (const raw of readFileSync(filepath, "utf-8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;

      const eq = line.indexOf("=");
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      const value = line
        .slice(eq + 1)
        .trim()
        .replace(/^["'](.*)["']$/, "$1");

      if (key && !process.env[key]) process.env[key] = value;
    }
  }
}
