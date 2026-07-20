"use client";

import { RouteError } from "@/components/shared/RouteError";

export default function TeamError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} area="this team" homeHref="/teams" homeLabel="My Teams" />;
}
