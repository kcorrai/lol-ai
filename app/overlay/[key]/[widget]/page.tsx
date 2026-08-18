import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isOverlayWidget } from "@/domains/creator/types";
import { isOverlayKeyFormat } from "@/domains/creator/overlayKey";
import { OverlayClient } from "./OverlayClient";

// The URL a streamer pastes into an OBS Browser Source.
//
// Deliberately outside every route group: it takes none of the app's chrome, no
// sidebar, no header, no fonts beyond what it needs. It is also outside the
// middleware matcher, so it stays reachable with no session — which is the whole
// point, since OBS cannot carry one (ADR-026).

export const dynamic = "force-dynamic";

// An overlay URL in a search index would be a leaked capability.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const MIN_REFRESH_SECONDS = 5;
const DEFAULT_REFRESH_SECONDS = 30;
const MAX_REFRESH_SECONDS = 300;

function resolveRefresh(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_REFRESH_SECONDS;
  return Math.min(MAX_REFRESH_SECONDS, Math.max(MIN_REFRESH_SECONDS, Math.trunc(parsed)));
}

export default function OverlayPage({
  params,
  searchParams,
}: {
  params: { key: string; widget: string };
  searchParams: { refresh?: string };
}): JSX.Element {
  // Neither is checked against the database here — the client fetch does that.
  // This only rejects what cannot possibly be valid, so a bad URL fails fast in
  // OBS rather than showing an empty box that looks like a broken overlay.
  if (!isOverlayKeyFormat(params.key)) notFound();
  if (!isOverlayWidget(params.widget)) notFound();

  return (
    <OverlayClient
      overlayKey={params.key}
      widget={params.widget}
      refreshSeconds={resolveRefresh(searchParams.refresh)}
    />
  );
}
