import { NextResponse } from "next/server";

// Public endpoint — VAPID public key is not secret
export function GET(): NextResponse {
  const key = process.env.VAPID_PUBLIC_KEY ?? null;
  return NextResponse.json({ key });
}
