"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { POSITION_LABELS } from "@/domains/meta/positions";
import type { LiveLaneEdge } from "@/domains/draft/advice/laneEdges";

interface Props {
  edges: LiveLaneEdge[];
}

const TONE = {
  blue: "text-accent-blue",
  red: "text-danger",
  even: "text-text-muted",
} as const;

export function LaneEdges({ edges }: Props): React.ReactElement | null {
  if (edges.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1">
      {edges.map((edge) => (
        <li
          key={edge.lane}
          className="flex items-center gap-2 text-[11.5px]"
          title={`Expected lane — a flex pick may land elsewhere`}
        >
          <span className="w-12 shrink-0 uppercase tracking-label text-text-faint">
            {POSITION_LABELS[edge.lane]}
          </span>
          <ChampionIcon name={edge.blue.key} size={20} />
          <span className={`flex-1 truncate ${TONE[edge.favoured]}`}>
            {edge.favoured === "even"
              ? "even lane"
              : edge.favoured === "blue"
                ? `${edge.blue.name} ahead`
                : `${edge.red.name} ahead`}
          </span>
          <ChampionIcon name={edge.red.key} size={20} />
          <span className="w-11 shrink-0 text-right font-mono text-text-muted">
            {edge.blueWinRate.toFixed(1)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
