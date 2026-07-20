"use client";

import { RouteError } from "@/components/shared/RouteError";

export default function ToolsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Tools are public, so send anonymous visitors somewhere they can actually use.
  return <RouteError {...props} area="this tool" homeHref="/tools" homeLabel="All Tools" />;
}
