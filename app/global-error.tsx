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
    <html lang="tr" className="dark">
      <body style={{ background: "#0A0E1A", color: "#E8F0FF", fontFamily: "system-ui, sans-serif" }}>
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
          <p style={{ fontSize: "4rem", fontWeight: "bold", color: "#C89B3C" }}>!</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "1rem" }}>
            Bir şeyler ters gitti
          </h1>
          <p style={{ color: "#8899BB", marginTop: "0.75rem", maxWidth: "24rem" }}>
            Beklenmedik bir hata oluştu. Lütfen tekrar dene.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "2rem",
              background: "#C89B3C",
              color: "#0A0E1A",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.625rem 1.25rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Tekrar Dene
          </button>
          {error.digest && (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#8899BB" }}>
              Hata ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
