import { summarize, type Sample } from "../src/lib/loadTest/summarize";

/**
 * A small load test with no dependencies (LA-126).
 *
 * It answers one question before real traffic does: at a given number of simultaneous visitors,
 * which pages slow down or fail, and are the pages meant to come from the cache actually coming
 * from it. Run it against a production build (`next build` + `next start`) — a dev server
 * compiles on demand and measures nothing useful — or against a preview deployment.
 *
 *   npx tsx scripts/loadTest.ts --base http://localhost:3008 --concurrency 50 --seconds 30
 *   npx tsx scripts/loadTest.ts --base https://… --paths /,/builds/Jhin,/meta
 *
 * Only GET pages that cost nothing per visitor belong in the default list. A public profile is
 * left out on purpose: each fresh one spends Riot budget, and a load test that drains the key is
 * the outage it is meant to predict.
 */

const DEFAULT_PATHS = [
  "/",
  "/tools",
  "/builds",
  "/builds/Jhin",
  "/builds/Kaisa/bot",
  "/meta",
  "/matchups/garen-vs-warwick",
  "/aram/tier-list",
  "/tools/tier-list",
  "/counters/Jhin",
  "/pricing",
];

const TIMEOUT_MS = 15_000;

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function hit(base: string, path: string): Promise<Sample> {
  const started = performance.now();
  try {
    const res = await fetch(base + path, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    await res.arrayBuffer();
    return {
      path,
      status: res.status,
      ms: Math.round(performance.now() - started),
      cache: res.headers.get("x-nextjs-cache"),
    };
  } catch {
    return { path, status: 0, ms: Math.round(performance.now() - started), cache: null };
  }
}

async function main(): Promise<void> {
  const base = arg("base", "http://localhost:3008").replace(/\/$/, "");
  const concurrency = Number(arg("concurrency", "20"));
  const seconds = Number(arg("seconds", "20"));
  const paths = arg("paths", DEFAULT_PATHS.join(",")).split(",");

  const samples: Sample[] = [];
  const deadline = Date.now() + seconds * 1000;
  let next = 0;

  // Each worker is one visitor clicking through the list as fast as the server answers.
  async function worker(): Promise<void> {
    while (Date.now() < deadline) {
      samples.push(await hit(base, paths[next++ % paths.length]));
    }
  }

  process.stdout.write(`${concurrency} visitors, ${seconds}s, against ${base}\n`);
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const rows = summarize(samples).map((s) => ({
    path: s.path,
    requests: s.requests,
    errors: s.errors,
    "p50 ms": s.p50,
    "p95 ms": s.p95,
    "p99 ms": s.p99,
    "cache hit": `${Math.round(s.cacheHitRate * 100)}%`,
  }));
  // A table is the output; the logging service is for the app, not for a CLI's report.
  // eslint-disable-next-line no-console
  console.table(rows);
  process.stdout.write(`${(samples.length / seconds).toFixed(1)} requests/second overall\n`);
}

void main();
