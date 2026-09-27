import { existsSync, readdirSync, readFileSync } from "fs";
import { dirname, join, relative, sep } from "path";

/**
 * The ISR pages under `root`, with the render mode each must declare (ADR-059, ADR-061).
 *
 * Left implicit, Next decides wrongly in both directions and neither shows in a test or a green
 * build: a page with a `no-cache` read under it is silently rendered per request, and a page that
 * reads search params is marked static whenever its `generateStaticParams` comes back empty, after
 * which every visit fails with "static to dynamic at runtime". So: reads search params →
 * `force-dynamic`; otherwise → `force-static` — except a page with an `f/` directory beside it,
 * whose filtered requests middleware rewrites there, and the copies under `f/` themselves.
 */
export interface RenderModeCase {
  file: string;
  source: string;
  expected: "force-static" | "force-dynamic";
}

function pages(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) pages(full, out);
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

export function renderModeCases(root: string): RenderModeCase[] {
  return pages(root)
    .map((file) => {
      const source = readFileSync(file, "utf8");
      const rel = relative(root, file);
      const rewritten = existsSync(join(dirname(file), "f")) || rel.split(sep).includes("f");
      const readsSearchParams = /\bsearchParams\b/.test(source);
      const expected: RenderModeCase["expected"] =
        readsSearchParams && !rewritten ? "force-dynamic" : "force-static";
      return { file: rel, source, expected };
    })
    .filter(({ source }) => /^export const revalidate\b/m.test(source));
}

export function declaresRenderMode(c: RenderModeCase): boolean {
  return new RegExp(`^export const dynamic = "${c.expected}";`, "m").test(c.source);
}
