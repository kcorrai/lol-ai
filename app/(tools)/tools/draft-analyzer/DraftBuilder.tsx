"use client";

import { useRouter } from "next/navigation";
import { ChampionCombobox, type ChampionOption } from "@/domains/meta/components/ChampionCombobox";
import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta/positions";
import type { CanonicalPosition } from "@/domains/meta/types";

interface Props {
  champions: ChampionOption[];
  blue: (string | null)[]; // length 5, indexed by ALL_POSITIONS order
  red: (string | null)[];
}

function encodeTeam(team: (string | null)[]): string {
  return team.map((c) => c ?? "").join(",");
}

export function DraftBuilder({ champions, blue, red }: Props) {
  const router = useRouter();

  function navigate(nextBlue: (string | null)[], nextRed: (string | null)[]): void {
    const params = new URLSearchParams();
    if (nextBlue.some(Boolean)) params.set("blue", encodeTeam(nextBlue));
    if (nextRed.some(Boolean)) params.set("red", encodeTeam(nextRed));
    const query = params.toString();
    router.push(`/tools/draft-analyzer${query ? `?${query}` : ""}`);
  }

  function setPick(side: "blue" | "red", index: number, key: string | null): void {
    if (side === "blue") {
      const next = [...blue];
      next[index] = key;
      navigate(next, red);
    } else {
      const next = [...red];
      next[index] = key;
      navigate(blue, next);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {(["blue", "red"] as const).map((side) => {
        const team = side === "blue" ? blue : red;
        const accent = side === "blue" ? "text-info" : "text-danger";
        const edge = side === "blue" ? "border-l-info" : "border-l-danger";
        return (
          <div
            key={side}
            className={`notch border border-l-2 border-border bg-surface p-4 ${edge}`}
          >
            <h2
              className={`mb-3 font-mono text-[11px] font-bold uppercase tracking-label ${accent}`}
            >
              {side === "blue" ? "Blue Team" : "Red Team"}
            </h2>
            <div className="flex flex-col gap-2">
              {ALL_POSITIONS.map((pos: CanonicalPosition, i) => {
                // Hide champions already taken on either team (a champion can't be
                // drafted twice), but keep this slot's own pick selectable.
                const current = team[i];
                const taken = new Set(
                  [...blue, ...red].filter((k): k is string => !!k && k !== current)
                );
                const options = champions.filter((c) => !taken.has(c.key));
                return (
                  <div key={pos} className="flex items-center gap-2">
                    <span className="hud-label w-16 shrink-0 text-[10px]">
                      {POSITION_LABELS[pos]}
                    </span>
                    <ChampionCombobox
                      champions={options}
                      value={team[i]}
                      position={pos}
                      onSelect={(key) => setPick(side, i, key)}
                      placeholder="Add champion…"
                      className="flex-1"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
