import { Illustration } from "../desktop/chrome";
import { PRO_TEAMS, type ProTeam } from "../proTeams";
import { Crest, Window } from "./screenChrome";

/**
 * The esports hub, drawn.
 *
 * Three of the blocks `app/(esports)/esports/page.tsx` stacks, in its order: `HubLive` with
 * its pulsing marker and series score, `HubSchedule`'s "Next up" rows, and the standings
 * panel from `HubRail`. The `// …` heading on the last one is that rail's own convention.
 *
 * The teams are real, and their crests are Riot's own (`proTeams.ts`). They were "TBD" and a
 * row of dashes, on the reasoning that naming a fixture asserts one that is not happening —
 * but the caption under every one of these drawings already says it is a drawing, and a
 * scoreboard nobody can recognise is a picture of a scoreboard rather than of this product.
 * What a reader knows at a glance is the crest; the scores and kickoff times beside it are
 * invented, exactly as the readiness score in the dashboard drawing is.
 */

const LIVE: { league: string; home: ProTeam; away: ProTeam; score: [string, string] } = {
  league: "LEC",
  home: PRO_TEAMS.G2,
  away: PRO_TEAMS.FNC,
  score: ["1", "0"],
};

const NEXT: readonly { at: string; home: ProTeam; away: ProTeam; bo: string }[] = [
  { at: "18:00", home: PRO_TEAMS.T1, away: PRO_TEAMS.GEN, bo: "Bo3" },
  { at: "21:00", home: PRO_TEAMS.BLG, away: PRO_TEAMS.JDG, bo: "Bo5" },
];

const STANDINGS: readonly { n: string; team: ProTeam; record: string }[] = [
  { n: "1", team: PRO_TEAMS.T1, record: "12–5" },
  { n: "2", team: PRO_TEAMS.GEN, record: "11–6" },
  { n: "3", team: PRO_TEAMS.HLE, record: "9–8" },
];

export function EsportsScreen(): React.ReactElement {
  return (
    <Illustration
      label="The esports hub drawn as an illustration: a live match with its series score, the next scheduled matches, and a league standings panel."
      caption="// Illustration — drawn, not a capture"
    >
      <Window name="Esports" meta="Free">
        <div className="grid gap-2.5 p-3">
          {/* Live now. The pulse is the one animated thing in any of these drawings, and it
              earns it: "live" is the claim the block exists to make. */}
          <div className="notch-sm border border-line-1 bg-surface p-2.5">
            <div className="flex items-center gap-1.5">
              <span aria-hidden className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping bg-danger opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex h-1.5 w-1.5 bg-danger" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-text">
                Live now
              </span>
              <span className="ml-auto font-mono text-[8.5px] uppercase tracking-[0.14em] text-text-faint">
                {LIVE.league} · Bo5
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-3">
              <Crest team={LIVE.home} size={22} />
              <span className="font-display text-[19px] font-extrabold tabular-nums leading-none text-text">
                {LIVE.score[0]}
                <span className="mx-1.5 text-text-faint">–</span>
                {LIVE.score[1]}
              </span>
              <Crest team={LIVE.away} size={22} />
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
              Next up
            </p>
            <div className="mt-1.5 grid">
              {NEXT.map((m) => (
                <div
                  key={m.at}
                  className="grid grid-cols-[32px_1fr_auto] items-center gap-2 border-b border-line-1 py-[6px] last:border-0"
                >
                  <span className="font-mono text-[9.5px] tabular-nums text-text-body">{m.at}</span>
                  <span className="flex items-center gap-1.5">
                    <Crest team={m.home} size={14} />
                    <span className="font-mono text-[9px] text-text-muted">{m.home.code}</span>
                    <span className="font-mono text-[9px] text-text-faint">vs</span>
                    <Crest team={m.away} size={14} />
                    <span className="font-mono text-[9px] text-text-muted">{m.away.code}</span>
                  </span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-faint">
                    {m.bo}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-line-1 pt-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
              {"// Standings"}
            </p>
            <div className="mt-1.5 grid gap-1">
              {STANDINGS.map((s) => (
                <div key={s.n} className="flex items-center gap-2">
                  <span className="w-3 font-mono text-[9.5px] tabular-nums text-text-faint">
                    {s.n}
                  </span>
                  <Crest team={s.team} size={14} />
                  <span className="flex-1 truncate font-mono text-[10px] text-text-muted">
                    {s.team.name}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-text-body">
                    {s.record}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Window>
    </Illustration>
  );
}
