"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** What failed, in the user's terms — "dashboard", "this tool". */
  area?: string;
  /** Where "go back" should lead. Defaults to the dashboard. */
  homeHref?: string;
  homeLabel?: string;
}

// Segment-level error UI. Unlike the root app/error.tsx this renders *inside* the
// segment's layout, so the shell (sidebar, nav) survives and the user can
// navigate away instead of being dropped onto a bare full-screen error.
export function RouteError({
  error,
  reset,
  area = "this page",
  homeHref = "/dashboard",
  homeLabel = "Go to Dashboard",
}: RouteErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
        <span className="text-xl font-bold text-danger" aria-hidden>
          !
        </span>
      </div>
      <h2 className="mt-4 font-display text-xl font-bold text-text md:text-2xl">
        Couldn&apos;t load {area}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-text-muted">
        Something went wrong on our end. Our team has been notified — you can retry, or head
        somewhere else and come back.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Try Again
        </button>
        <Link
          href={homeHref}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface"
        >
          {homeLabel}
        </Link>
      </div>
      {error.digest && (
        <p className="mt-5 text-xs text-text-muted">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
