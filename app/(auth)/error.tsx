"use client";

import { RouteError } from "@/components/shared/RouteError";

export default function AuthError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // An unauthenticated user cannot reach /dashboard, so point back at sign-in.
  return <RouteError {...props} area="this page" homeHref="/login" homeLabel="Back to Sign In" />;
}
