import Image from "next/image";
import { championSplashUrl } from "@/lib/ddragon";
import { ListenButton } from "@/domains/coaching/components/ListenButton";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

/**
 * The single sentence the report is about, over the champion it is about.
 *
 * The headline is the highest-priority weakness rather than a generated one-liner: the model
 * already decided what matters most, and re-phrasing it here would be inventing a verdict.
 */
export function ReportVerdict({
  report,
  isPro,
}: {
  report: CoachingReportDetail;
  isPro: boolean;
}): React.ReactElement | null {
  if (!report.summary && !report.coachPersonaResponse) return null;

  const champion = report.championRecommendations?.[0]?.championName ?? report.focusArea ?? null;
  const headline =
    report.weaknesses?.find((w) => w.priority === "high")?.area ??
    report.weaknesses?.[0]?.area ??
    report.focusArea ??
    "What these games say";

  return (
    <section className="notch-lg glow-accent-soft relative overflow-hidden border border-accent">
      {champion && (
        <>
          <Image
            src={championSplashUrl(champion)}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover object-[56%_26%] opacity-[0.28]"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-dark from-[32%] to-[rgba(6,10,9,0.62)]" />
        </>
      )}
      <div className={`relative px-6 py-6 ${champion ? "" : "bg-surface"}`}>
        <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-accent motion-safe:animate-pulse" aria-hidden />
          <span className="font-mono text-[10.5px] uppercase tracking-label text-accent">
            {"// Coach's verdict"}
          </span>
          {isPro && report.coachPersonaResponse && (
            <ListenButton reportId={report.id} text={report.coachPersonaResponse} />
          )}
        </div>

        <h2 className="max-w-[22ch] font-display text-[24px] font-extrabold uppercase leading-[1.14] tracking-[0.02em] text-text md:text-[32px]">
          {headline}
        </h2>

        {report.summary && (
          <p className="mt-4 max-w-[64ch] text-[15.5px] text-text-body">{report.summary}</p>
        )}
        {report.coachPersonaResponse && (
          <p className="mt-3 max-w-[64ch] text-[15.5px] text-text-body">
            {report.coachPersonaResponse}
          </p>
        )}
      </div>
    </section>
  );
}
