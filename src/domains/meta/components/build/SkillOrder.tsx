import type { ChampionBuild } from "@/domains/meta";

const ABILITIES = ["Q", "W", "E", "R"] as const;
const ABILITY_COLOR: Record<string, string> = {
  Q: "bg-sky-500/80",
  W: "bg-emerald-500/80",
  E: "bg-amber-500/80",
  R: "bg-rose-500/80",
};

export function SkillOrder({ build }: { build: Pick<ChampionBuild, "skillOrder" | "skillMaxOrder"> }) {
  if (build.skillOrder.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-text">Skill Order</h2>
        {build.skillMaxOrder.length > 0 && (
          <span className="text-sm text-text-muted">
            Max order:{" "}
            <span className="font-bold text-text">{build.skillMaxOrder.join(" → ")}</span>
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <tbody>
            {ABILITIES.map((ability) => (
              <tr key={ability}>
                <td className="pr-2 text-sm font-bold text-text-muted">{ability}</td>
                {build.skillOrder.map((skill, level) => (
                  <td key={level}>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white ${
                        skill === ability ? ABILITY_COLOR[ability] : "bg-surface-2 text-text-muted/40"
                      }`}
                    >
                      {skill === ability ? level + 1 : ""}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
