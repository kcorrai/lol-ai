"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { youtubeEmbedUrl, youtubeVideoId } from "@/domains/marketplace/youtube";

/**
 * A coach's intro video, loaded only when asked for.
 *
 * Nothing from YouTube is fetched until the reader presses play — no player,
 * no thumbnail — so a profile visit costs no third-party request, and the
 * embed uses the cookie-less host. We host no video ourselves (ADR-021).
 */
export function IntroVideo({
  url,
  coachName,
}: {
  url: string;
  coachName: string;
}): React.ReactElement | null {
  const [playing, setPlaying] = useState(false);
  const id = youtubeVideoId(url);
  if (!id) return null;

  return (
    <section className="notch overflow-hidden border border-border bg-surface">
      <div className="relative aspect-video w-full bg-surface-dark">
        {playing ? (
          <iframe
            src={`${youtubeEmbedUrl(id)}?autoplay=1`}
            title={`${coachName} introduces themselves`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="bg-hero-fade absolute inset-0 flex flex-col items-center justify-center gap-3 text-text transition-colors hover:bg-surface-2"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-background">
              <Play className="ml-1 h-7 w-7" fill="currentColor" aria-hidden />
            </span>
            <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.03em]">
              Meet {coachName}
            </span>
            <span className="text-[12px] text-text-muted">Plays from YouTube</span>
          </button>
        )}
      </div>
    </section>
  );
}
