"use client";

import { useSession, signOut } from "next-auth/react";
import type { SessionStatus } from "@/types/auth.types";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    status: status as SessionStatus,
    signOut: () => signOut({ callbackUrl: "/" }),
  };
}
