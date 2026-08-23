"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkinMedia } from "@/lib/cdragon/skinMedia";
import { SkinClipTile } from "./SkinClipTile";
import { skinViews } from "./skinViews";

interface SkinInspectorProps {
  skins: SkinMedia[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}

export function SkinInspector({
  skins,
  index,
  onIndexChange,
  onClose,
}: SkinInspectorProps): React.ReactElement | null {
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [chromaId, setChromaId] = useState<number | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const skin = skins[index];
  const views = useMemo(() => (skin ? skinViews(skin) : []), [skin]);
  if (!skin) return null;

  function step(delta: number): void {
    // Wraps, so the arrow keys never dead-end on the first or last skin.
    onIndexChange((index + delta + skins.length) % skins.length);
    setViewKey(null);
    setChromaId(null);
    setPlaying(null);
  }

  const view = views.find((v) => v.key === viewKey) ?? views[0];
  const chroma = skin.chromas.find((c) => c.id === chromaId) ?? null;
  const shown = chroma ? chroma.tileUrl : view.url;

  return (
    <Dialog.Root
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Content
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") step(-1);
            if (event.key === "ArrowRight") step(1);
          }}
          className="notch fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto border border-line-2 bg-surface p-4 shadow-2xl sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="truncate font-display text-lg font-bold text-text sm:text-xl">
                {chroma ? chroma.name : skin.name}
              </Dialog.Title>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {skin.rarity && (
                  <span
                    className={cn(
                      "tag-cut border px-2 py-0.5 font-mono text-[10px] uppercase tracking-label",
                      skin.rarity.toneClass
                    )}
                  >
                    {skin.rarity.label}
                  </span>
                )}
                {skin.isLegacy && (
                  <span className="tag-cut border border-line-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-label text-text-muted">
                    Legacy
                  </span>
                )}
                <span className="font-mono text-[10px] uppercase tracking-label text-text-faint">
                  {index + 1} / {skins.length}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous skin"
                className="rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:border-accent/40 hover:text-text"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next skin"
                className="rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:border-accent/40 hover:text-text"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <Dialog.Close
                aria-label="Close"
                className="ml-1 rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:border-accent/40 hover:text-text"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
          </div>

          {/* object-contain over a fixed frame: the three views have three different aspect
              ratios, and cropping the load screen would cut the model off at the knees. */}
          <div className="relative mt-4 h-[46vh] min-h-[240px] overflow-hidden rounded-xl border border-border bg-background">
            <Image
              key={shown}
              src={shown}
              alt={chroma ? chroma.name : `${skin.name} — ${view.label}`}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-contain"
              unoptimized
            />
          </div>

          {views.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {views.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setViewKey(option.key);
                    setChromaId(null);
                  }}
                  className={cn(
                    "tag-cut border px-3 py-1 font-mono text-[10.5px] uppercase tracking-label transition-colors",
                    option.key === view.key && !chroma
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-border bg-background text-text-muted hover:border-accent/30 hover:text-text"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {skin.chromas.length > 0 && (
            <div className="mt-4">
              <p className="hud-label mb-2 text-[10px]">{`// Chromas · ${skin.chromas.length}`}</p>
              <div className="flex flex-wrap gap-2">
                {skin.chromas.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    title={option.name}
                    aria-label={option.name}
                    aria-pressed={option.id === chromaId}
                    onClick={() => setChromaId(option.id === chromaId ? null : option.id)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                      option.id === chromaId ? "border-accent" : "border-line-2"
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${option.colors[0]} 50%, ${option.colors[1] ?? option.colors[0]} 50%)`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {skin.description && (
            <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-text-muted">
              {skin.description}
            </p>
          )}

          {skin.clips.length > 0 && (
            <div className="mt-4">
              <p className="hud-label mb-2 text-[10px]">{"// In-game effects"}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {skin.clips.map((clip) => (
                  <SkinClipTile
                    key={clip.videoUrl}
                    description={clip.description}
                    videoUrl={clip.videoUrl}
                    posterUrl={clip.posterUrl}
                    playing={playing === clip.videoUrl}
                    onPlay={() => setPlaying(clip.videoUrl)}
                  />
                ))}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
