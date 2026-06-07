"use client";

import type { DeathPoint } from "@/domains/analysis/services/heatmapService";

const LOL_MAP_W = 14820;
const LOL_MAP_H = 14881;
const DISPLAY_SIZE = 480;
const MAP_IMG = "https://ddragon.leagueoflegends.com/cdn/img/map/map11.png";

function toSvgX(x: number): number {
  return (x / LOL_MAP_W) * DISPLAY_SIZE;
}

function toSvgY(y: number): number {
  // Y is inverted: Riot (0,0) = bottom-left, SVG (0,0) = top-left
  return (1 - y / LOL_MAP_H) * DISPLAY_SIZE;
}

interface Props {
  deaths: DeathPoint[];
  isLoading?: boolean;
  summary?: string | null;
}

export function DeathHeatMap({ deaths, isLoading, summary }: Props) {
  if (isLoading) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-xl border border-border bg-surface">
        <p className="text-sm text-text-muted animate-pulse">Harita yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto overflow-hidden rounded-xl border border-border"
        style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
      >
        {/* Map background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MAP_IMG}
          alt="Summoner's Rift"
          width={DISPLAY_SIZE}
          height={DISPLAY_SIZE}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Heat map SVG overlay */}
        <svg
          className="absolute inset-0"
          width={DISPLAY_SIZE}
          height={DISPLAY_SIZE}
          viewBox={`0 0 ${DISPLAY_SIZE} ${DISPLAY_SIZE}`}
        >
          <defs>
            <filter id="heat-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>

          {/* Blurred heat layer */}
          <g filter="url(#heat-blur)">
            {deaths.map((d, i) => (
              <circle
                key={i}
                cx={toSvgX(d.x)}
                cy={toSvgY(d.y)}
                r="18"
                fill="rgba(220, 38, 38, 0.45)"
              />
            ))}
          </g>

          {/* Sharp dots on top for precise location */}
          {deaths.map((d, i) => (
            <circle
              key={`dot-${i}`}
              cx={toSvgX(d.x)}
              cy={toSvgY(d.y)}
              r="3"
              fill="rgba(220, 38, 38, 0.8)"
            />
          ))}
        </svg>

        {/* Death count badge */}
        <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
          {deaths.length} ölüm
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="rounded-lg border border-border bg-surface p-3 text-sm text-text-muted">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-accent">
            AI Analiz:
          </span>
          {summary}
        </div>
      )}

      {deaths.length === 0 && !isLoading && (
        <p className="text-center text-sm text-text-muted">
          Bu filtre için ölüm verisi bulunamadı.
        </p>
      )}
    </div>
  );
}
