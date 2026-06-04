"use client";

import Image from "next/image";
import { useState } from "react";
import { itemIconUrl } from "@/lib/ddragon";

interface ItemIconProps {
  itemId: number;
  size?: number;
}

export function ItemIcon({ itemId, size = 24 }: ItemIconProps) {
  const [errored, setErrored] = useState(false);

  if (itemId === 0 || errored) {
    return (
      <span
        className="inline-block rounded bg-surface-2 ring-1 ring-border/40"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Image
      src={itemIconUrl(itemId)}
      alt={`Item ${itemId}`}
      width={size}
      height={size}
      className="rounded ring-1 ring-border/40"
      onError={() => setErrored(true)}
      unoptimized
    />
  );
}
