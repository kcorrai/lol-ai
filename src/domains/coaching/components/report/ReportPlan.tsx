import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { championIconUrl } from "@/lib/ddragon";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

const PANEL = "notch border border-border bg-surface";

/** The action items, in the order the coach put them in. */
export function ReportPlan({
  items,
}: {
  items: NonNullable<CoachingReportDetail["actionItems"]>;
}): React.ReactElement {
  return (
    <section className={PANEL}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-1 bg-surface-2 px-5 py-3.5">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text">
          {"// Action plan · do these in order"}
        </span>
        <span className="hud-label text-[10.5px]">{items.length} steps</span>
      </div>

      {items.map((item, i) => (
        <div
          key={item.priority}
          // The impact is a sentence, not "+9 LP", so its column is wide enough to read and
          // left-aligned — right-aligned prose ends up a ragged column of two-word lines.
          className="grid gap-4 border-b border-line-1 px-5 py-4 last:border-b-0 sm:grid-cols-[30px_minmax(0,1fr)_200px] sm:items-start"
        >
          <span className="font-mono text-[13px] font-bold text-accent">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="font-display text-[15.5px] font-bold uppercase tracking-[0.03em] text-text">
              {item.action}
            </p>
            <p className="mt-1.5 max-w-[62ch] text-sm text-text-body">{item.howTo}</p>
          </div>
          <div className="border-line-1 sm:border-l sm:pl-4">
            <p className="hud-label mb-1.5 text-[9.5px]">Expected impact</p>
            <p className="text-[13px] text-accent">{item.expectedImpact}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-text-faint">
              {item.timeframe}
            </p>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-3.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
          Progress is tracked over your next ranked games
        </span>
        <Link
          href="/improvement"
          className="notch-sm flex h-[34px] items-center gap-1.5 bg-accent px-3.5 font-mono text-[11px] font-bold uppercase tracking-label text-background transition-opacity hover:opacity-90"
        >
          Add to my plan
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

/** The champions the coach wants queued, with the reason attached. */
export function ReportChampions({
  recs,
}: {
  recs: NonNullable<CoachingReportDetail["championRecommendations"]>;
}): React.ReactElement {
  return (
    <section className={PANEL}>
      <div className="border-b border-line-1 px-5 py-3.5">
        <span className="hud-label text-[10.5px]">{"// Focus champions · keep queueing these"}</span>
      </div>
      {recs.map((rec) => (
        <div
          key={rec.championName}
          className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line-1 px-5 py-3.5 last:border-b-0"
        >
          <Image
            src={championIconUrl(rec.championName)}
            alt=""
            aria-hidden
            width={40}
            height={40}
            className="tag-cut border border-line-2"
            unoptimized
          />
          <div className="min-w-0">
            <p className="font-display text-[15px] font-bold uppercase tracking-[0.04em] text-text">
              {rec.championName}
            </p>
            <p className="mt-0.5 text-[13.5px] text-text-body">{rec.reason}</p>
          </div>
          <span
            className={`tag-cut border px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] ${
              rec.priority === "high"
                ? "border-accent bg-accent/15 text-accent"
                : "border-warning bg-warning/15 text-warning"
            }`}
          >
            {rec.priority}
          </span>
        </div>
      ))}
    </section>
  );
}
