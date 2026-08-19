"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  videoUrl: string;
  posterUrl: string;
  alt: string;
  className?: string;
  /** Set on above-the-fold cards — these posters are the page's LCP element. */
  priority?: boolean;
}

/**
 * Riot's official ability clip, playing on hover or focus.
 *
 * `preload="none"` and no `autoPlay` are the point: the meta report shows twenty champions at
 * once, and eagerly loading twenty webm files would cost megabytes for clips most readers never
 * look at. The poster image carries the page until someone actually points at a card.
 *
 * Not every champion has a clip on Riot's CDN, so a load error falls back to the image rather than
 * leaving a black rectangle.
 */
export function AbilityClip({
  videoUrl,
  posterUrl,
  alt,
  className = "",
  priority,
}: Props): React.ReactElement {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function start() {
    if (failed) return;
    setPlaying(true);
    // play() rejects when the browser blocks autoplay; treat that as "just show the image".
    videoRef.current?.play().catch(() => setFailed(true));
  }

  function stop() {
    setPlaying(false);
    videoRef.current?.pause();
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
      tabIndex={0}
    >
      <Image
        src={posterUrl}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        className={`object-cover transition-opacity duration-300 ${playing && !failed ? "opacity-0" : "opacity-100"}`}
      />
      {!failed && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop
          playsInline
          preload="none"
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${playing ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
