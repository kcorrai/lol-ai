"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// Primary marketing CTA that adapts to auth state: logged-in users are sent to the
// dashboard instead of the sign-up flow. Defaults to the sign-up copy while the
// session is loading / for anonymous visitors (avoids a hydration flash).
export function StartFreeCta({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  return (
    <Link href={isAuthenticated ? "/dashboard" : "/register"} className={className}>
      {isAuthenticated ? "Go to Dashboard →" : "Get Started Free"}
    </Link>
  );
}
