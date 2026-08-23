import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { formatGamePatch, type MatchupReport } from "@/domains/meta";

const VERDICT_COPY: Record<MatchupReport["verdict"], { label: string; className: string }> = {
  favored: { label: "Favoured", className: "text-success" },
  even: { label: "Even", className: "text-text" },
  unfavored: { label: "Unfavoured", className: "text-danger" },
};

export function MatchupReportCard({ report }: { report: MatchupReport }) {
  const verdict = VERDICT_COPY[report.verdict];
  const hasData = report.games > 0;
  const aWin = report.aWinRateVsB;
  const bWin = Math.round((100 - aWin) * 10) / 10;
  const winColor = aWin >= 52 ? "text-success" : aWin <= 48 ? "text-danger" : "text-text";

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-6">
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <ChampionIcon name={report.championA.key} size={64} />
          <span className="text-sm font-semibold text-text">{report.championA.name}</span>
        </div>
        <div className="text-center">
          {hasData ? (
            <>
              <div className={`font-display text-4xl font-black ${winColor}`}>
                {aWin.toFixed(1)}%
              </div>
              <div className="text-xs text-text-muted">{report.championA.name} win rate</div>
              <div className={`mt-1 text-sm font-bold ${verdict.className}`}>{verdict.label}</div>
            </>
          ) : (
            <>
              <div className="font-display text-3xl font-black text-text-muted">—</div>
              <div className="text-xs text-text-muted">Not enough games</div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <ChampionIcon name={report.championB.key} size={64} />
          <span className="text-sm font-semibold text-text">{report.championB.name}</span>
        </div>
      </div>

      {/* Opposed head-to-head bar — both champions' win rates in the matchup */}
      {hasData && (
        <div className="mt-5">
          <div className="flex h-3 overflow-hidden rounded-full">
            <div className="bg-info" style={{ width: `${aWin}%` }} />
            <div className="bg-danger" style={{ width: `${bWin}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-semibold">
            <span className="text-info">
              {report.championA.name} {aWin.toFixed(1)}%
            </span>
            <span className="text-danger">
              {bWin.toFixed(1)}% {report.championB.name}
            </span>
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-text-muted">
        {hasData
          ? `Based on ${report.games.toLocaleString()} ranked games this patch (${formatGamePatch(report.patch)}).`
          : `op.gg has no significant sample for this exact pairing yet, so no head-to-head win rate is shown. The lane tips below are based on champion stats.`}
      </p>

      {report.hints.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-text-muted">
            Lane tips
          </h2>
          <ul className="flex flex-col gap-2">
            {report.hints.map((hint, i) => (
              <li key={i} className="flex gap-2 text-sm text-text">
                <span className="mt-0.5 text-accent">▸</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
