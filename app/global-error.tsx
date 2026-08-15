"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

// Catches errors in the root layout itself (not route segments).
// Must be a minimal component — cannot use context from the broken root layout.
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body style={{ background: "#080B0A", color: "#E9F5EE", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            textAlign: "center",
            padding: "1.5rem",
          }}
        >
          <p style={{ fontSize: "4rem", fontWeight: "bold", color: "#C6FF3D" }}>!</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "1rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6C817B", marginTop: "0.75rem", maxWidth: "24rem" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "2rem",
              background: "#C6FF3D",
              color: "#080B0A",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.625rem 1.25rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          {error.digest && (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#6C817B" }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
