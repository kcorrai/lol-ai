import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * Loads .env then .env.local so a standalone `tsx scripts/...` run picks up the
 * same variables the Next dev server does. Only fills in what is missing, so
 * real CI/production environment variables always win.
 */
export function loadEnvFiles(filenames: string[] = [".env", ".env.local"]): void {
  for (const filename of filenames) {
    const filepath = resolve(process.cwd(), filename);
    if (!existsSync(filepath)) continue;
    for (const raw of readFileSync(filepath, "utf-8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const val = line
        .slice(eq + 1)
        .trim()
        .replace(/^["'](.*)["']$/, "$1");
      if (key && !process.env[key]) process.env[key] = val;
    }
  }
}
