import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const API_VERSION = "1";

// Matches the response envelope defined in API_DESIGN.md
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  const res = NextResponse.json(
    { data, meta: { requestId: randomUUID(), apiVersion: API_VERSION } },
    { status }
  );
  res.headers.set("X-API-Version", API_VERSION);
  return res;
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse {
  const res = NextResponse.json(
    {
      error: { code, message, ...(details ? { details } : {}) },
      meta: { requestId: randomUUID(), apiVersion: API_VERSION },
    },
    { status }
  );
  res.headers.set("X-API-Version", API_VERSION);
  return res;
}
