"use client";

import Image from "next/image";
import { useState } from "react";
import { championIconUrl } from "@/lib/ddragon";

interface ChampionIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function ChampionIcon({ name, size = 32, className = "" }: ChampionIconProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-surface-2 font-semibold text-text-muted ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {name[0]}
      </span>
    );
  }

  return (
    <Image
      src={championIconUrl(name)}
      alt={name}
      width={size}
      height={size}
      className={`rounded ${className}`}
      onError={() => setErrored(true)}
      unoptimized
    />
  );
}
