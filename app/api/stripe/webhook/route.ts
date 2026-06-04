import { NextResponse } from "next/server";

// Stripe is no longer the active payment provider — LemonSqueezy replaced it.
// This endpoint is intentionally disabled to prevent stale webhook processing.
// Historical Stripe subscription rows remain in the DB for reference only.
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Stripe payments are no longer active. Please use LemonSqueezy." },
    { status: 410 }
  );
}
