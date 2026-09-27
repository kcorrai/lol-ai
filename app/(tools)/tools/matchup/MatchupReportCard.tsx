import { formatGamePatch, type MatchupReport } from "@/domains/meta";
import { MatchupVersus } from "@/domains/meta/components/matchup/MatchupVersus";
import { LaneTips } from "@/domains/meta/components/matchup/LaneTips";

export function MatchupReportCard({ report }: { report: MatchupReport }) {
  const patch = formatGamePatch(report.patch);
  return (
    <div className="grid gap-4">
      <MatchupVersus
        a={report.championA}
        b={report.championB}
        aWinRate={report.aWinRateVsB}
        games={report.games}
        verdict={report.verdict}
        footnote={
          report.games > 0
            ? `patch ${patch}`
            : "op.gg has no significant sample for this exact pairing yet, so no head-to-head win rate is shown. The lane tips below are based on champion stats."
        }
      />
      <LaneTips hints={report.hints} />
    </div>
  );
}
