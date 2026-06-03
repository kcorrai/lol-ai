"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
        <span className="text-2xl font-bold text-danger">!</span>
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-text md:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-sm text-text-muted">
        An unexpected error occurred. Our team has been notified. You can try again or go back to
        the dashboard.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface"
        >
          Go to Dashboard
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-text-muted">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
