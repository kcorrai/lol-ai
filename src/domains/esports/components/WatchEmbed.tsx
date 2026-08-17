"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * A pro broadcast, played on the page rather than on someone else's.
 *
 * **Nothing loads until the reader asks.** The iframe is not rendered at all
 * until the button is clicked, which is what keeps Twitch and YouTube from
 * writing a cookie for a reader who never intended to watch anything — the
 * section serves TR and EU traffic, and a third-party player mounted on page
 * load is a consent question we would otherwise have to answer with a banner.
 * It also keeps a schedule page from loading four video players at once.
 *
 * The placeholder is a real button, not a div with a click handler: it is the
 * control that starts playback, and it has to be reachable by keyboard.
 */
export function WatchEmbed({
  src,
  label,
  title,
}: {
  /** The provider's embed URL. Built by `embedUrl`, never by a caller. */
  src: string;
  /** What the reader is about to watch — "Game 2", "LEC English". */
  label: string;
  title: string;
}): React.ReactElement {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="notch group flex aspect-video w-full flex-col items-center justify-center gap-2 border border-border bg-surface-dark transition-colors hover:border-accent/40"
      >
        <span className="tag-cut inline-grid h-11 w-11 place-items-center border border-accent/50 bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
          <Play aria-hidden className="h-4 w-4 fill-current" />
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          Play {label}
        </span>
        {/* Said once, plainly, instead of a banner: the reader is choosing to
            load someone else's player, and that is worth one line. */}
        <span className="text-[10.5px] text-text-faint">Loads the official player</span>
      </button>
    );
  }

  return (
    <iframe
      src={src}
      title={title}
      // YouTube's terms require a viewport of at least 200×200 and forbid
      // covering any part of the player; the aspect-video box does both.
      className="notch aspect-video w-full border border-border"
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowFullScreen
      // The player is a third party. It gets to be a video and nothing else.
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
