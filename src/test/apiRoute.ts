import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { vi } from "vitest";

/**
 * Test harness for App Router route handlers (TASK-262).
 *
 * Route tests must declare these two mocks themselves — `vi.mock` is file-scoped and hoisted, so a
 * helper cannot register them on the caller's behalf:
 *
 *   vi.mock("next-auth");
 *   vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
 *
 * The second one matters even for routes that never touch auth: `withAuth` imports `authOptions`,
 * which pulls in the Prisma adapter at module load.
 */

interface RouteRequestInit {
  method?: string;
  /** Serialized as a JSON body. Pass a raw string to test malformed input. */
  body?: unknown;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

const ORIGIN = "http://localhost:3001";

/**
 * Dynamic-segment routes read their id back out of `req.nextUrl.pathname` rather than a `params`
 * argument (`withAuth` only forwards `req`), so `path` must be the real URL the route would receive
 * — `/api/riot/acc-1`, not `/api/riot/[riotAccountId]`.
 */
export function routeRequest(path: string, init: RouteRequestInit = {}): NextRequest {
  const url = new URL(path, ORIGIN);
  for (const [key, value] of Object.entries(init.searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const hasBody = init.body !== undefined;
  return new NextRequest(url, {
    method: init.method ?? (hasBody ? "POST" : "GET"),
    headers: {
      ...(hasBody ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    ...(hasBody
      ? { body: typeof init.body === "string" ? init.body : JSON.stringify(init.body) }
      : {}),
  });
}

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

/** Makes `withAuth` see an authenticated user and forward `{ userId, userEmail }` to the handler. */
export function authenticateAs(user: SessionUser): void {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { email: null, name: null, ...user },
    expires: "2099-01-01T00:00:00.000Z",
  } as never);
}

/** Makes `withAuth` see no session, which it answers with 401 before the handler runs. */
export function authenticateAsNobody(): void {
  vi.mocked(getServerSession).mockResolvedValue(null as never);
}

interface ApiEnvelope<T> {
  status: number;
  data: T | undefined;
  error: { code: string; message: string } | undefined;
}

/**
 * Unwraps the `apiSuccess`/`apiError` envelope (`src/lib/api/response.ts`).
 *
 * Note that `withAuth` catches thrown `ApiError`s and turns them into a response, so route tests
 * assert on `error.code` here rather than with `expect(...).rejects`.
 */
export async function readApiResponse<T = unknown>(res: Response): Promise<ApiEnvelope<T>> {
  const body = (await res.json()) as {
    data?: T;
    error?: { code: string; message: string };
  };
  return { status: res.status, data: body.data, error: body.error };
}
