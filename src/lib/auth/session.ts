import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export type DomainContext = {
  userId: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
  };
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
  } | null;
};

// Thin wrapper — use in Server Components and API routes
export async function getSession() {
  return getServerSession(authOptions);
}

// Throws ApiError(401) when unauthenticated — use in API routes via withAuth
export async function getRequiredSession() {
  const session = await getSession();
  if (!session?.user?.id) throw Errors.unauthorized();
  return session;
}

// Returns full domain context for the current user.
// Combines session + subscription in a single call to minimize DB round-trips.
export async function getDomainContext(): Promise<DomainContext> {
  const session = await getRequiredSession();
  const userId = session.user.id;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  return {
    userId,
    user: {
      id: userId,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
    },
    subscription,
  };
}
