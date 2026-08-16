"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AbilityView {
  slot: "P" | "Q" | "W" | "E" | "R";
  name: string;
  description: string;
  iconUrl: string;
  videoUrl: string;
  cooldown?: string;
  cost?: string;
  range?: string;
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-background px-2.5 py-1 text-xs text-text-muted">
      {label} <span className="font-semibold text-text">{value}</span>
    </span>
  );
}

export function ChampionAbilities({ abilities }: { abilities: AbilityView[] }) {
  const [active, setActive] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const ability = abilities[active];

  function select(i: number) {
    setActive(i);
    setVideoFailed(false);
  }

  return (
    <div className="notch min-w-0 border border-border bg-surface p-4 sm:p-6">
      <h2 className="hud-label mb-4 text-[10.5px]">{"// Abilities"}</h2>

      {/* Slot selector */}
      <div className="mb-5 flex flex-wrap gap-2">
        {abilities.map((a, i) => (
          <button
            key={a.slot}
            type="button"
            onClick={() => select(i)}
            title={a.name}
            className={cn(
              "group relative flex items-center gap-2 rounded-xl border p-1.5 pr-3 transition-colors",
              i === active
                ? "border-accent/60 bg-accent/10"
                : "border-border bg-background hover:border-accent/30"
            )}
          >
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
              <Image src={a.iconUrl} alt={a.name} fill sizes="36px" className="object-cover" unoptimized />
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                i === active ? "text-accent" : "text-text-muted group-hover:text-text"
              )}
            >
              {a.slot}
            </span>
          </button>
        ))}
      </div>

      {/* Active ability detail */}
      <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-background">
          {!videoFailed ? (
            <video
              key={ability.videoUrl}
              src={ability.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              onError={() => setVideoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Image src={ability.iconUrl} alt={ability.name} width={72} height={72} unoptimized className="rounded-lg" />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {ability.slot === "P" ? "Passive" : ability.slot}
          </span>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold text-text">{ability.name}</h3>
          {(ability.cooldown || ability.cost || ability.range) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {ability.cooldown && <Chip label="Cooldown" value={`${ability.cooldown}s`} />}
              {ability.cost && <Chip label="Cost" value={ability.cost} />}
              {ability.range && <Chip label="Range" value={ability.range} />}
            </div>
          )}
          <p className="mt-3 text-sm leading-relaxed text-text-muted">{ability.description}</p>
        </div>
      </div>
    </div>
  );
}
