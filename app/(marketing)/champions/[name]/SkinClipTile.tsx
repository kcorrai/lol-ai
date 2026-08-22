"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface SkinClipTileProps {
  description: string;
  videoUrl: string;
  posterUrl: string;
  playing: boolean;
  onPlay: () => void;
}

/**
 * One of a skin's in-game ability effect clips.
 *
 * These run to several megabytes each, so nothing is fetched until the reader asks for it —
 * a click, rather than the hover-to-play the ability cards use, and only one plays at a time.
 * A clip that fails to load leaves the icon in place instead of a black rectangle.
 */
export function SkinClipTile({
  description,
  videoUrl,
  posterUrl,
  playing,
  onPlay,
}: SkinClipTileProps): React.ReactElement {
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onPlay}
      className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-background text-left"
    >
      {playing && !failed ? (
        <video
          src={videoUrl}
          poster={posterUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <Image
            src={posterUrl}
            alt=""
            fill
            sizes="200px"
            className="object-contain p-4"
            unoptimized
          />
          {!failed && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="h-6 w-6 text-accent" />
            </span>
          )}
        </>
      )}
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-2 pb-1 pt-4 text-[11px] text-text-body">
        {description}
      </span>
    </button>
  );
}
