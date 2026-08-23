"use client";

import { RouteError } from "@/components/shared/RouteError";

export default function AppError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} area="your dashboard" />;
}
