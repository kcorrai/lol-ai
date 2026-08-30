import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Makes the website's own hooks work inside this window (ADR-043).
 *
 * Every data hook on the website calls `fetch("/api/...")` and reads the `{ data, error }`
 * envelope back. None of them can run here as written: this webview is served from
 * `tauri://localhost`, so the path resolves to nothing, and the content policy
 * (`connect-src 'self' ipc:`) would refuse the request even if it did.
 *
 * So the request is answered rather than sent. A relative `/api/*` call is handed to the
 * Rust core over IPC, which attaches the device token and talks to the website; what comes
 * back is rebuilt into a real `Response`. The hook cannot tell, which is the point — it is
 * the website's hook, unmodified, and it stays that way when the website edits it.
 *
 * Two properties survive intact. The token never enters this context: the core holds it and
 * this module never sees one. And the policy is still true rather than merely satisfied —
 * nothing here opens a socket.
 */

/** The shape `desktop_fetch` returns. `null` means this machine holds no token. */
interface ProxyResponse {
  status: number;
  body: unknown;
}

const METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"];

/**
 * The website's error envelope, built here for the failures that never reach it.
 *
 * A hook reads `error.message` to decide what to put on the screen, so a bridge failure has
 * to arrive in the shape a website failure would. Anything else surfaces as "Request
 * failed" and the player learns nothing.
 */
function envelope(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * This window's own address. Parameterised rather than read inline so the rule below can
 * be tested without a DOM — there is no `location` outside a browser, and inventing one is
 * a worse answer than naming the default in one place.
 */
function selfOrigin(): string {
  return globalThis.location?.origin ?? "http://localhost";
}

/**
 * The path this call is aimed at, or null if it is not ours to answer.
 *
 * Only same-origin `/api/*` is taken. An absolute URL to somewhere else is left alone and
 * will fail on the content policy, which is the correct outcome and a better one than this
 * module quietly proxying it — the policy is the app's statement about where it may reach,
 * and a bridge that routed around it would make that statement false.
 */
export function bridgedPath(input: RequestInfo | URL, origin = selfOrigin()): string | null {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  let url: URL;
  let base: URL;
  try {
    base = new URL(origin);
    url = new URL(raw, base);
  } catch {
    return null;
  }

  // Protocol and host rather than `origin`. This window is served from `tauri://localhost`,
  // and `URL.origin` is the string "null" for every scheme the standard does not call
  // special — so comparing origins would find `tauri://localhost` and `evil://anywhere`
  // identical, and hand the second one to the core.
  if (url.protocol !== base.protocol || url.host !== base.host) return null;
  if (!url.pathname.startsWith("/api/")) return null;

  return `${url.pathname}${url.search}`;
}

async function readBody(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  const raw =
    init?.body !== undefined && init.body !== null
      ? init.body
      : input instanceof Request
        ? await input.clone().text()
        : null;

  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") {
    // FormData, Blob and friends. Nothing behind these screens sends one, and guessing at
    // a JSON shape for it would be worse than saying so.
    throw new Error("The desktop app can only send JSON to LoL AI Coach.");
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  return METHODS.includes(method) ? method : "GET";
}

/**
 * Replaces `fetch` with one that answers `/api/*` through the core.
 *
 * Idempotent, and a no-op outside Tauri: the browser preview has no core to ask, and there
 * a relative `/api` call reaching the Vite dev server is the more useful failure.
 */
export function installApiBridge(): void {
  if (!isTauri()) return;
  if ("__lolaiBridged" in globalThis.fetch) return;

  const original = globalThis.fetch.bind(globalThis);

  const bridged: typeof fetch = async (input, init) => {
    const path = bridgedPath(input);
    if (path === null) return original(input, init);

    let answer: ProxyResponse | null;
    try {
      answer = await invoke<ProxyResponse | null>("desktop_fetch", {
        path,
        method: methodOf(input, init),
        body: await readBody(input, init),
      });
    } catch (err) {
      // The core refused or could not reach the website. Both are 502-shaped from a
      // caller's side: the request was well formed and there is no answer to give.
      return envelope(
        502,
        "DESKTOP_BRIDGE_FAILED",
        typeof err === "string" ? err : "Could not reach LoL AI Coach."
      );
    }

    if (answer === null) {
      return envelope(401, "UNAUTHORIZED", "This machine is not paired. Pair it to continue.");
    }

    // 204 and 304 must not carry one, and `Response` throws rather than dropping it.
    const bodyless = answer.status === 204 || answer.status === 304;
    return new Response(bodyless ? null : JSON.stringify(answer.body ?? null), {
      status: answer.status,
      headers: { "content-type": "application/json" },
    });
  };

  Object.defineProperty(bridged, "__lolaiBridged", { value: true });
  globalThis.fetch = bridged;
}
