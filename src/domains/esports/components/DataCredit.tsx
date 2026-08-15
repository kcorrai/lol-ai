/**
 * Source credit and the Riot disclaimer. Every esports page carries it — the
 * data and the logos are Riot's, and the section is a community one (ADR-016).
 */
export function DataCredit({ className = "" }: { className?: string }): React.ReactElement {
  return (
    <p className={`text-[11px] leading-relaxed text-text-faint ${className}`}>
      Schedules, results and team data from the public LoL Esports feed. LaneIQ is not endorsed by
      Riot Games and does not reflect the views or opinions of Riot Games or anyone officially
      involved in producing or managing League of Legends.
    </p>
  );
}
