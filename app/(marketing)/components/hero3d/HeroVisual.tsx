"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

// The WebGL scene is heavy and client-only — load it lazily so it never blocks
// the initial paint. The poster below is the LCP element.
const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

const POSTER_URL = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg";

export function HeroVisual() {
  const [enable3d, setEnable3d] = useState(false);

  useEffect(() => {
    // Skip the 3D scene for reduced-motion users and small screens.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 768px)").matches;
    setEnable3d(!reduced && !small);
  }, []);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-surface/40">
      {/* Poster — paints immediately, stays as the fallback */}
      <Image
        src={POSTER_URL}
        alt="League of Legends champion splash art"
        fill
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover object-[60%_20%] opacity-40"
        style={{ filter: "saturate(0.85)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

      {enable3d && (
        <div className="absolute inset-0">
          <HeroCanvas />
        </div>
      )}
    </div>
  );
}
