import { statSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import type { Plugin } from "vite";

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * How this app resolves the website's tree (ADR-043).
 *
 * Shared by `vite.config.ts` and `vitest.config.ts` because the two drifting apart is a
 * specific and unpleasant failure: a module aliased in one and not the other passes its
 * tests against the real package and ships against the shim, or the reverse. `tsconfig.json`
 * holds a third copy, which TypeScript needs in its own format and which the comment there
 * points back to.
 */

export const desktopSrc = fileURLToPath(new URL("./src", import.meta.url));
export const webSrc = fileURLToPath(new URL("../src", import.meta.url));
export const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const compat = (name: string): string =>
  fileURLToPath(new URL(`./src/compat/${name}`, import.meta.url));

/**
 * The framework this app does not have.
 *
 * The website is a Next application; this is Vite. Each entry is a small module in
 * `src/compat/` standing in for Next's, so a component lifted from the website compiles
 * here without being edited — and keeps compiling when the website edits it.
 *
 * `@` is deliberately NOT here. Vite inserts its own `vite:alias` plugin ahead of every
 * user plugin, including one declared `enforce: "pre"` — so an alias entry for `@` would
 * rewrite the specifier before `webTreeFallback` ever saw it, and every website import
 * would resolve against this app's `src` and fail to load. The fallback below is the only
 * thing that resolves `@`, and it checks this app first anyway.
 */
export const aliases: Record<string, string> = {
  "next/navigation": compat("next-navigation.ts"),
  "next/dynamic": compat("next-dynamic.tsx"),
  "next/image": compat("next-image.tsx"),
  "next/link": compat("next-link.tsx"),
  "next-auth/react": compat("next-auth-react.ts"),
};

/**
 * Resolves `@/…` against this app first and the website second.
 *
 * The website's components import `@/hooks/…`, `@/lib/…` and `@/domains/…`, all meaning the
 * website's own tree; this app's mean its own. A single alias cannot be both, so the two
 * roots are tried in order — safe only because no path exists under both, which
 * `src/lib/aliasCollisions.test.ts` asserts.
 *
 * A plugin rather than another alias entry because Vite's aliases are rewrites, not
 * candidates: the first pattern that matches wins whether or not the file it names exists.
 */
export function webTreeFallback(): Plugin {
  return {
    name: "lolai-web-tree-fallback",
    enforce: "pre",
    resolveId(source: string) {
      if (!source.startsWith("@/")) return null;
      const relative = source.slice(2);

      for (const root of [desktopSrc, webSrc]) {
        for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
          const candidate = `${root}/${relative}${ext}`;
          // `isFile`, not `existsSync`. The website has both `lib/utils.ts` and a
          // `lib/utils/` directory beside it, and the extensionless candidate matches the
          // directory — which resolves, then fails to load as "access denied" with nothing
          // to say it was a folder.
          if (isFile(candidate)) return candidate;
        }
      }
      return null;
    },
  };
}
