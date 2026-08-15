import Image from "next/image";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { championSplashUrl } from "@/lib/ddragon";
import { ActionRow, InsightCard, Meter } from "./ReportParts";
import type { Action, Grade, Insight } from "./ReportParts";

const INSIGHTS: readonly Insight[] = [
  {
    kicker: "Critical",
    severity: "critical",
    headline: "No vision before the river",
    detail: "62% of crossings unwarded · 11 deaths",
  },
  {
    kicker: "High",
    severity: "warn",
    headline: "Objectives start without prio",
    detail: "7 of 12 drake attempts, 0 lanes pushed",
  },
  {
    kicker: "Medium",
    severity: "info",
    headline: "Tilt queue",
    detail: "Requeue under 120s · 27% win rate",
  },
];

const GRADES: readonly Grade[] = [
  { label: "Clear speed", value: 78 },
  { label: "Gank conversion", value: 71 },
  { label: "Objective setup", value: 41, tone: "info" },
  { label: "Vision before fights", value: 23, tone: "danger" },
];

const ACTIONS: readonly Action[] = [
  { n: "01", text: "Path to the objective you can contest, not enemy blue.", lp: "+9 LP" },
  { n: "02", text: "Ward the pit 45s before spawn, not at spawn.", lp: "+6 LP" },
  { n: "03", text: "No requeue inside 5 minutes of a loss.", lp: "+3 LP" },
];

function HeadStat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <p className="hud-label">{label}</p>
      <p className="mt-0.5 font-mono text-base font-bold text-text">{value}</p>
    </div>
  );
}

// A worked example of the report a player gets. The numbers are illustrative and
// fixed — this is the sales pitch, not a live query.
export function SampleReport(): React.ReactElement {
  return (
    <section id="report" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="notch-lg mx-auto max-w-[1240px] overflow-hidden border border-border bg-surface">
        {/* Splash header */}
        <div className="relative h-[220px] overflow-hidden">
          <Image
            src={championSplashUrl("Viego")}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1240px) 100vw, 1240px"
            className="object-cover object-[50%_22%] opacity-[0.62]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--surface-panel)_4%,rgba(6,10,9,.35)_70%)]" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-5 p-5 md:px-7">
            <div className="flex items-center gap-3.5">
              <ChampionIcon name="Viego" size={52} />
              <div>
                <p className="font-display text-xl font-extrabold uppercase tracking-[0.04em] text-text">
                  Kayjay#EUW
                </p>
                <p className="hud-label mt-0.5">
                  Emerald IV · Jungle · 20 games · 9W 11L
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <HeadStat label="AI time" value="87s" />
              <HeadStat label="Events" value="4,318" />
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
          <div className="border-b border-border p-6 md:p-7 lg:border-b-0 lg:border-r">
            <span className="font-mono text-[11px] uppercase tracking-label text-accent">
              {"// Coach says"}
            </span>
            <p className="my-3.5 max-w-[22ch] font-display text-[22px] font-bold uppercase leading-[1.24] text-text">
              You lose the 20 seconds after full clear.
            </p>
            <div className="grid gap-2.5">
              {INSIGHTS.map((insight) => (
                <InsightCard key={insight.headline} {...insight} />
              ))}
            </div>
          </div>

          <div className="p-6 md:p-7">
            <span className="hud-label">{"// Graded"}</span>
            <div className="my-3 grid gap-3">
              {GRADES.map((grade) => (
                <Meter key={grade.label} {...grade} />
              ))}
            </div>
            <span className="font-mono text-[11px] uppercase tracking-label text-accent">
              {"// Do these three"}
            </span>
            <div className="mt-3 grid gap-2.5">
              {ACTIONS.map((action) => (
                <ActionRow key={action.n} {...action} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
