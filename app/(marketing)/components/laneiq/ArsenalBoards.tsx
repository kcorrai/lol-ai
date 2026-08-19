"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
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
const BLUE = ["Ksante", "Sejuani", "Orianna"];
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
const MATCHES: ReadonlyArray<{
  league: string;
  a: string;
  b: string;
  score: string;
  live: boolean;
}> = [
  { league: "LEC", a: "G2", b: "FNC", score: "1 – 0", live: true },
  { league: "LCK", a: "T1", b: "GEN", score: "2 – 1", live: false },
  { league: "LPL", a: "BLG", b: "JDG", score: "0 – 0", live: false },
];

export function EsportsVisual(): React.ReactElement {
  return (
    <Frame label="// Live now">
      {MATCHES.map((m) => (
        <Row key={`${m.a}${m.b}`}>
          <div className="grid grid-cols-[46px_1fr_auto] items-center gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
              {m.league}
            </span>
            <span className="text-[13.5px] text-text">
              {m.a} <span className="text-text-faint">vs</span> {m.b}
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
