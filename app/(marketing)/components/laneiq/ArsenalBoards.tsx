"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { PRO_TEAMS, type ProTeam } from "./proTeams";
import { Frame, Row } from "./ArsenalFrame";

/**
 * The two Arsenal illustrations that draw a live board rather than a readout —
 * a draft in progress and a scoreboard. They sit apart from the text panels in
 * `ArsenalVisuals` because they are the only ones that need champion art and
 * per-cell motion.
 */

// ── Draft Room ────────────────────────────────────────────────────────────
// 30s is the real default turn timer and 5 the maximum series length
// (app/api/draft/route.ts:14,17).
// Display names, not Data Dragon keys: `normalizeChampionKey` owns the mapping
// and only recognises the apostrophe form ("K'Sante" → KSante). Writing the key
// by hand as "Ksante" 403s and silently falls back to a letter tile.
const BLUE = ["K'Sante", "Sejuani", "Orianna"];
const RED = ["Aatrox", "Vi", "Ahri"];

/** Picks land one after another, the way they do in a real draft. */
function PickCell({
  name,
  index,
  tone,
}: {
  name: string;
  index: number;
  tone: "blue" | "red";
}): React.ReactElement {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.12, ease: [0.16, 0.84, 0.44, 1] }}
      className={`flex items-center gap-2 border px-2 py-1.5 ${
        tone === "blue" ? "border-accent-blue/40 bg-accent-blue/5" : "border-danger/40 bg-danger/5"
      }`}
    >
      <ChampionIcon name={name} size={24} />
    </motion.div>
  );
}

export function DraftVisual(): React.ReactElement {
  return (
    <Frame label="// Game 3 of 5 · fearless">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-label text-accent-blue">
            Blue
          </span>
          {BLUE.map((c, i) => (
            <PickCell key={c} name={c} index={i} tone="blue" />
          ))}
        </div>
        <div className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-label text-danger">Red</span>
          {RED.map((c, i) => (
            <PickCell key={c} name={c} index={i + 3} tone="red" />
          ))}
        </div>
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="font-mono text-[11px] text-accent">Blue pick 4 · 00:30</span>
        <span className="font-mono text-[10.5px] text-text-muted">18 champions locked out</span>
      </div>
    </Frame>
  );
}

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
  live: boolean;
}> = [
  { league: "LEC", a: PRO_TEAMS.G2, b: PRO_TEAMS.FNC, score: "1 – 0", live: true },
  { league: "LCK", a: PRO_TEAMS.T1, b: PRO_TEAMS.GEN, score: "2 – 1", live: false },
  { league: "LPL", a: PRO_TEAMS.BLG, b: PRO_TEAMS.JDG, score: "0 – 0", live: false },
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
    <Frame label="// Live now">
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
            <span className={`font-mono text-[13px] ${m.live ? "text-accent" : "text-text-body"}`}>
              {m.live ? "● " : ""}
              {m.score}
            </span>
          </div>
        </Row>
      ))}
    </Frame>
  );
}
