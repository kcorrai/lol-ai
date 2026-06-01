// In-flight request deduplication.
//
// Problem: two concurrent callers request the same Riot resource before
// either has finished. Without dedup, both hit the network simultaneously,
// doubling rate-limit consumption and returning inconsistent data.
//
// Solution: the first caller creates the promise; subsequent concurrent
// callers with the same key reuse it. Once resolved, the key is cleared
// so the next call is a fresh fetch.

const inflight = new Map<string, Promise<unknown>>();

export function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
