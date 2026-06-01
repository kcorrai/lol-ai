import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// Matches the response envelope defined in API_DESIGN.md
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { data, meta: { requestId: randomUUID() } },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      error: { code, message, ...(details ? { details } : {}) },
      meta: { requestId: randomUUID() },
    },
    { status }
  );
}
