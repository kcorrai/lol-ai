"use client";

import { CopyField } from "@/domains/creator/components/CopyField";
import { OverlayWidget } from "@/domains/creator/components/widgets/OverlayWidget";
import { OVERLAY_WIDGETS, type OverlayPayload } from "@/domains/creator/types";

// The five overlays, each with its URL and a live preview.
//
// The preview mounts the widget component directly rather than framing the
// overlay URL. It has to: the app sends `frame-ancestors 'none'`, which blocks
// same-origin framing as well as cross-origin (ADR-026). Rendering the component
// is better anyway — the preview and OBS draw from one component and one
// payload, so they cannot drift.

const LABELS: Record<(typeof OVERLAY_WIDGETS)[number], string> = {
  rank: "Rank & session LP",
  session: "Session record",
  lastgame: "Last game",
  champions: "Champion pool",
  goal: "Climb goal",
};

const DESCRIPTIONS: Record<(typeof OVERLAY_WIDGETS)[number], string> = {
  rank: "Tier, LP, and what this session has done to it.",
  session: "Wins, losses and KDA since the session started.",
  lastgame: "Champion, result and line from the last finished game.",
  champions: "Your five most played champions this season.",
  goal: "A progress bar toward the rank you are chasing.",
};

export function OverlayCatalog({
  origin,
  overlayKey,
  preview,
}: {
  origin: string;
  overlayKey: string;
  preview: OverlayPayload | null;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {OVERLAY_WIDGETS.map((widget) => (
        <section
          key={widget}
          className="rounded-lg border border-border bg-surface p-4"
          aria-labelledby={`overlay-${widget}`}
        >
          <h3 id={`overlay-${widget}`} className="font-display text-base text-text">
            {LABELS[widget]}
          </h3>
          <p className="mb-3 text-sm text-text-muted">{DESCRIPTIONS[widget]}</p>

          <div className="grid gap-4 lg:grid-cols-2">
            <CopyField
              label="Browser source URL"
              value={`${origin}/overlay/${overlayKey}/${widget}`}
            />

            <div
              className="flex items-center justify-center rounded-lg border border-dashed border-border bg-ink-1000 p-4"
              // The checkerboard reads as "transparent" the way an image editor
              // does, so the creator can see that the widget will composite onto
              // their scene rather than sit on a black card.
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #111817 25%, transparent 25%), linear-gradient(-45deg, #111817 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111817 75%), linear-gradient(-45deg, transparent 75%, #111817 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            >
              {preview ? (
                <OverlayWidget widget={widget} payload={preview} />
              ) : (
                <span className="text-xs text-text-muted">Preview loading…</span>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
