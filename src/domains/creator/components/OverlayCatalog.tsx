"use client";

import { CopyField } from "@/domains/creator/components/CopyField";
import { ObsSteps } from "@/domains/creator/components/ObsSteps";
import { OverlayStage } from "@/domains/creator/components/OverlayStage";
import { OverlayWidget } from "@/domains/creator/components/widgets/OverlayWidget";
import { OVERLAY_META } from "@/domains/creator/overlayMeta";
import { OVERLAY_WIDGETS, type OverlayPayload } from "@/domains/creator/types";

// The five overlays, each with its URL and a live preview.
//
// The preview mounts the widget component directly rather than framing the
// overlay URL. It has to: the app sends `frame-ancestors 'none'`, which blocks
// same-origin framing as well as cross-origin (ADR-026). Rendering the component
// is better anyway — the preview and OBS draw from one component and one
// payload, so they cannot drift.

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
    <div className="grid gap-4 xl:grid-cols-2">
      {OVERLAY_WIDGETS.map((widget) => {
        const meta = OVERLAY_META[widget];
        const Icon = meta.icon;

        return (
          <section
            key={widget}
            className="notch overflow-hidden border border-line-1 bg-surface transition-colors hover:border-line-2"
            aria-labelledby={`overlay-${widget}`}
          >
            <header className="flex items-start justify-between gap-3.5 border-b border-line-1 px-[18px] pb-3.5 pt-4">
              <div className="min-w-0">
                <h3
                  id={`overlay-${widget}`}
                  className="flex items-center gap-2.5 font-display text-[15px] font-extrabold uppercase tracking-wider text-text"
                >
                  <Icon className="h-4 w-4 shrink-0 text-accent" />
                  {meta.label}
                </h3>
                <p className="mt-1.5 text-[13px] text-text-muted">{meta.description}</p>
              </div>
              <span className="tag-cut shrink-0 whitespace-nowrap border border-line-2 bg-ink-1000 px-2 py-1 font-mono text-[9.5px] tracking-label text-text-faint">
                {meta.size}
              </span>
            </header>

            <OverlayStage theme={preview?.theme ?? "dark"} live={preview !== null}>
              {preview ? (
                <OverlayWidget widget={widget} payload={preview} />
              ) : (
                <span className="font-mono text-xs text-text-muted">Preview loading…</span>
              )}
            </OverlayStage>

            <div className="border-t border-line-1 px-[18px] pb-4 pt-3.5">
              <CopyField
                label="Browser source URL"
                value={`${origin}/overlay/${overlayKey}/${widget}`}
              />
            </div>
          </section>
        );
      })}

      <ObsSteps />
    </div>
  );
}
