import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { apiError } from "@/lib/api/response";

type AdminHandler = (req: NextRequest) => Promise<NextResponse>;

// Protects admin routes by verifying the current user's email matches ADMIN_EMAIL.
// Falls back gracefully — if ADMIN_EMAIL is not set, all authenticated users are blocked.
export function withAdminAuth(handler: AdminHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return apiError("FORBIDDEN", "Admin access not configured", 403);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    if (session.user.email !== adminEmail) {
      return apiError("FORBIDDEN", "Admin access required", 403);
    }

    return handler(req);
  };
}
