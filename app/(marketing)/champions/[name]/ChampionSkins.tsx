"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SkinMedia } from "@/lib/cdragon/skinMedia";
import { SkinInspector } from "./SkinInspector";

const MAX_SWATCHES = 4;

/**
 * The skin strip, and the door to the inspector.
 *
 * Cards lead with the load screen render rather than the splash: splash art is an
 * illustration, and the question this section is here to answer is what the skin looks like
 * once you are in a game. When Community Dragon could not be read there are no renders, and
 * the strip falls back to the landscape splash gallery it has always been.
 */
export function ChampionSkins({ skins }: { skins: SkinMedia[] }): React.ReactElement | null {
  const [active, setActive] = useState<number | null>(null);

  if (skins.length <= 1) return null;

  // All of a champion's media comes from one catalogue read, so this is all-or-nothing —
  // the strip never mixes portrait renders with landscape splashes.
  const hasRenders = skins.some((skin) => skin.loadScreenUrl);

  return (
    <div className="notch min-w-0 border border-border bg-surface p-4 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="hud-label text-[10.5px]">{"// Skins"}</h2>
        <span className="text-xs text-text-muted/60">
          {hasRenders ? `${skins.length} total · in-game view` : `${skins.length} total`}
        </span>
      </div>

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {skins.map((skin, index) => (
          <button
            key={skin.num}
            type="button"
            onClick={() => setActive(index)}
            title={`Inspect ${skin.name}`}
            className={cn(
              "group shrink-0 snap-start text-left",
              hasRenders ? "w-36 sm:w-40" : "w-56"
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-xl border border-border transition-colors group-hover:border-accent/50",
                hasRenders ? "aspect-[3/4]" : "aspect-[16/9]"
              )}
            >
              <Image
                src={skin.loadScreenUrl ?? skin.splashUrl}
                // Decorative: the caption below already names the skin, and alt text here
                // made every card announce its name twice.
                alt=""
                fill
                sizes={hasRenders ? "160px" : "224px"}
                className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
                unoptimized
              />
              {skin.rarity && (
                <span
                  className={cn(
                    "tag-cut absolute left-1.5 top-1.5 border bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-label",
                    skin.rarity.toneClass
                  )}
                >
                  {skin.rarity.label}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-xs text-text-muted group-hover:text-text">
                {skin.name}
              </span>
              {skin.chromas.length > 0 && (
                <span className="flex shrink-0 items-center gap-0.5" aria-hidden>
                  {skin.chromas.slice(0, MAX_SWATCHES).map((chroma) => (
                    <span
                      key={chroma.id}
                      className="h-1.5 w-1.5 rounded-full ring-1 ring-black/40"
                      style={{ background: chroma.colors[0] }}
                    />
                  ))}
                </span>
              )}
            </div>
            {skin.chromas.length > 0 && (
              <span className="sr-only">{skin.chromas.length} chromas</span>
            )}
          </button>
        ))}
      </div>

      {active !== null && (
        <SkinInspector
          skins={skins}
          index={active}
          onIndexChange={setActive}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
