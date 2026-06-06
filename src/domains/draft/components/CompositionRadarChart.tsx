"use client";

import type { TeamComposition } from "../types/draft.types";

const SIZE = 200;
const CX = 100;
const CY = 105;
const MAX_R = 72;
const N = 5;

const AXES: Array<{ key: keyof Omit<TeamComposition, "summary">; label: string }> = [
  { key: "teamfightPower", label: "Teamfight" },
  { key: "engagePower", label: "Engage" },
  { key: "splitPushPower", label: "Split" },
  { key: "pickPotential", label: "Pick" },
  { key: "disengagePower", label: "Disengage" },
];

function polar(cx: number, cy: number, r: number, i: number): [number, number] {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function polygon(scores: number[], cx: number, cy: number, maxR: number): string {
  return scores
    .map((s, i) => {
      const [x, y] = polar(cx, cy, (s / 10) * maxR, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function gridPolygon(fraction: number): string {
  return Array.from({ length: N }, (_, i) => {
    const [x, y] = polar(CX, CY, MAX_R * fraction, i);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

interface CompositionRadarChartProps {
  blue: TeamComposition;
  red: TeamComposition;
}

export function CompositionRadarChart({ blue, red }: CompositionRadarChartProps) {
  const blueScores = AXES.map(({ key }) => blue[key]);
  const redScores = AXES.map(({ key }) => red[key]);

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-semibold text-text-muted">Güç Dağılımı</p>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
        {/* Grid rings */}
        {[0.33, 0.66, 1].map((f) => (
          <polygon
            key={f}
            points={gridPolygon(f)}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border"
          />
        ))}

        {/* Axis lines */}
        {AXES.map((_, i) => {
          const [x, y] = polar(CX, CY, MAX_R, i);
          return (
            <line key={i} x1={CX} y1={CY} x2={x.toFixed(1)} y2={y.toFixed(1)}
              stroke="currentColor" strokeWidth="0.5" className="text-border" />
          );
        })}

        {/* Red polygon */}
        <polygon
          points={polygon(redScores, CX, CY, MAX_R)}
          fill="rgb(239 68 68 / 0.15)"
          stroke="rgb(239 68 68 / 0.7)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Blue polygon */}
        <polygon
          points={polygon(blueScores, CX, CY, MAX_R)}
          fill="rgb(59 130 246 / 0.15)"
          stroke="rgb(59 130 246 / 0.7)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Labels */}
        {AXES.map(({ label }, i) => {
          const [x, y] = polar(CX, CY, MAX_R + 16, i);
          return (
            <text key={i} x={x.toFixed(1)} y={y.toFixed(1)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill="currentColor" className="text-text-muted">
              {label}
            </text>
          );
        })}
      </svg>

      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-blue-500/70" /> Mavi
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-red-500/70" /> Kırmızı
        </span>
      </div>
    </div>
  );
}
