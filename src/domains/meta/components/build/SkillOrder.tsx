import { completeSkillOrder } from "@/domains/meta/services/skillOrder";
import type { ChampionBuild } from "@/domains/meta";

const ABILITIES = ["Q", "W", "E", "R"] as const;
const ABILITY_COLOR: Record<string, string> = {
  Q: "bg-info/80",
  W: "bg-accent/80",
  E: "bg-warning/80",
  R: "bg-danger/80",
};

export function SkillOrder({ build }: { build: Pick<ChampionBuild, "skillOrder" | "skillMaxOrder"> }) {
  if (build.skillOrder.length === 0) return null;

  // Idempotent: covers builds cached (up to 30 days) before the service completed the order.
  const levels = completeSkillOrder(build.skillOrder, build.skillMaxOrder);

  return (
    <div className="notch border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="hud-label text-[10.5px]">Skill Order</h2>
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
                {levels.map((skill, level) => (
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
