"use client";

import { useCallback, useEffect, useState } from "react";
import { OverlayWidget } from "@/domains/creator/components/widgets/OverlayWidget";
import type { OverlayPayload, OverlayWidget as WidgetName } from "@/domains/creator/types";

// Polling rather than SSE.
//
// An OBS Browser Source is a full Chromium tab that may sit open for an
// eight-hour stream. A held-open connection per source would pin a serverless
// function for the whole broadcast; a fetch every thirty seconds costs one
// request and survives OBS suspending and resuming the source by itself.

export interface OverlayClientProps {
  overlayKey: string;
  widget: WidgetName;
  refreshSeconds: number;
}

export function OverlayClient({
  overlayKey,
  widget,
  refreshSeconds,
}: OverlayClientProps): JSX.Element {
  const [payload, setPayload] = useState<OverlayPayload | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/overlay/${overlayKey}`, { cache: "no-store" });
      if (res.status === 404) {
        setMissing(true);
        return;
      }
      if (!res.ok) return; // A blip keeps the last good render rather than blanking the scene.
      const body = (await res.json()) as { data: OverlayPayload };
      setPayload(body.data);
      setMissing(false);
    } catch {
      // Same reasoning: a dropped request must not clear what is on screen.
    }
  }, [overlayKey]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), refreshSeconds * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSeconds]);

  // Nothing at all until the first payload lands. An OBS source that renders a
  // spinner shows a spinner on stream, which is worse than showing nothing.
  if (missing) {
    return (
      <div className="p-3 font-sans text-sm text-danger">
        This overlay link is not active. Check the URL in your Streamer Kit.
      </div>
    );
  }
  if (!payload) return <div />;

  return <OverlayWidget widget={widget} payload={payload} />;
}
