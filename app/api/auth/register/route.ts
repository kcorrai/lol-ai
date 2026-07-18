import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { registerUser } from "@/domains/identity/services/registrationService";

const REGISTER_LIMIT = { limit: 20, windowMs: 3_600_000 };

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  refCode: z.string().min(1).max(16).toUpperCase().nullish().transform((v) => v ?? undefined),
});

export async function POST(req: NextRequest) {
  const rateCheck = await checkRateLimit(`register:${getIp(req)}`, REGISTER_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid request body" } }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } },
      { status: 422 }
    );
  }

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" } },
      { status: 409 }
    );
  }

  return NextResponse.json({ data: { userId: result.userId } }, { status: 201 });
}
