"use client";

import Image from "next/image";
import { PRO_TEAMS, type ProTeam } from "./proTeams";
import { Frame, Row } from "./ArsenalFrame";

/**
 * The Arsenal scoreboard. It sits apart from the text panels in `ArsenalVisuals` because it
 * needs team crests. The draft board that used to share this file is `DraftDemo.tsx`.
 */

// ── Esports ───────────────────────────────────────────────────────────────
// Riot's own crests rather than three-letter codes in text (`proTeams.ts`). A scoreboard is
// something a reader recognises at a glance or not at all, and the glance is the logo — the
// panel beside this one says the section is about what the pros are doing, so the picture
// should be the part of that a fan can name without reading.
const MATCHES: ReadonlyArray<{
  league: string;
  a: ProTeam;
  b: ProTeam;
  score: string;
}> = [
  { league: "LEC", a: PRO_TEAMS.G2, b: PRO_TEAMS.FNC, score: "1 – 0" },
  { league: "LCK", a: PRO_TEAMS.T1, b: PRO_TEAMS.GEN, score: "2 – 1" },
  { league: "LPL", a: PRO_TEAMS.BLG, b: PRO_TEAMS.JDG, score: "0 – 0" },
];

/**
 * One crest at the size a row can afford.
 *
 * `object-contain` inside a fixed box, because these logos are every aspect ratio there is —
 * a round crest beside a wide wordmark — and a row of them has to line up regardless. It is
 * the same reason `TeamCrest` in the esports domain exists; that one is not imported here
 * because a domain's components are not marketing's to reach into (CLAUDE.md 4).
 */
function Crest({ team, size = 20 }: { team: ProTeam; size?: number }): React.ReactElement {
  return (
    <Image
      src={team.logo}
      alt=""
      aria-hidden
      width={size}
      height={size}
      unoptimized
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export function EsportsVisual(): React.ReactElement {
  return (
    // These scores are fixed. The frame used to say "Live now" over them with a live dot, a
    // claim anyone who follows the leagues could check and find false.
    <Frame label="// Illustration · scoreboard">
      {MATCHES.map((m) => (
        <Row key={`${m.a.code}${m.b.code}`}>
          <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
              {m.league}
            </span>
            <span className="flex min-w-0 items-center gap-2 text-[13.5px] text-text">
              <Crest team={m.a} />
              <span className="truncate">{m.a.code}</span>
              <span className="shrink-0 text-text-faint">vs</span>
              <Crest team={m.b} />
              <span className="truncate">{m.b.code}</span>
            </span>
            <span className="font-mono text-[13px] text-text-body">{m.score}</span>
          </div>
        </Row>
      ))}
    </Frame>
  );
}
