import { NextResponse } from "next/server";

// Stripe checkout is no longer active — use /api/lemonsqueezy/checkout instead.
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Stripe checkout is no longer active. Use LemonSqueezy checkout." },
    { status: 410 }
  );
}
