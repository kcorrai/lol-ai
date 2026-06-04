"use client";

import Image from "next/image";
import { useState } from "react";
import { summonerSpellUrl } from "@/lib/ddragon";

interface SummonerSpellIconProps {
  spellId: number;
  size?: number;
}

export function SummonerSpellIcon({ spellId, size = 20 }: SummonerSpellIconProps) {
  const [errored, setErrored] = useState(false);
  const src = summonerSpellUrl(spellId);

  if (!src || errored) {
    return (
      <span
        className="inline-block rounded bg-surface-2 ring-1 ring-border/40"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={`Spell ${spellId}`}
      width={size}
      height={size}
      className="rounded ring-1 ring-border/40"
      onError={() => setErrored(true)}
      unoptimized
    />
  );
}
