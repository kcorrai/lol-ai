import * as React from "react";

/**
 * Memoise a server function for the lifetime of one request.
 *
 * `React.cache` is what Next uses to stop `generateMetadata` and the page body
 * doing the same expensive read twice. It exists in the React build Next ships
 * and **not** in the plain React the unit tests run against, so importing it
 * directly turns every suite that touches such a service into
 * `TypeError: cache is not a function`.
 *
 * Memoisation is an optimisation, never correctness: without it the work simply
 * happens twice. So when `cache` is missing this hands back the function
 * untouched rather than failing, and the tests exercise the same code the server
 * runs.
 */
export function perRequest<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  const cache = (React as { cache?: (f: (...args: TArgs) => TResult) => typeof fn }).cache;
  return typeof cache === "function" ? cache(fn) : fn;
}
