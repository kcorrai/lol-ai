"use client";

import { motion } from "framer-motion";
import { PreviewBadge } from "@/domains/onboarding/preview/PreviewBadge";

// Sample "earned" badges shown during the guided first-journey. A brand-new user has zero earned
// badges, so the real page is a wall of greyed-out locks — this illustrates the reward the tour is
// pointing at (TASK-219). Deterministic sample data, clearly labelled (see PreviewBadge).

interface SampleBadge {
  icon: string;
  name: string;
  description: string;
  tier: string;
  color: string;
}

const SAMPLE_BADGES: SampleBadge[] = [
  { icon: "🎯", name: "Sharpshooter", description: "10+ kills in a ranked game", tier: "Gold", color: "#F5B942" },
  { icon: "🛡️", name: "Unkillable", description: "Win a game with 0 deaths", tier: "Platinum", color: "#3FB7A6" },
  { icon: "👁️", name: "Vision Lord", description: "40+ vision score in a match", tier: "Silver", color: "#B8C1D9" },
  { icon: "🔥", name: "On a Heater", description: "Win 5 ranked games in a row", tier: "Diamond", color: "#5B8DEF" },
];

function SampleCard({ badge, index }: { badge: SampleBadge; index: number }): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.12, duration: 0.35, ease: "easeOut" }}
      className="relative flex flex-col items-center gap-3 rounded-xl border p-5 text-center"
      style={{
        borderColor: `${badge.color}55`,
        boxShadow: `0 0 28px ${badge.color}14, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-3xl"
        style={{ background: `${badge.color}22`, border: `2px solid ${badge.color}` }}
      >
        {badge.icon}
      </div>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: `${badge.color}22`, color: badge.color }}
      >
        {badge.tier}
      </span>
      <div>
        <p className="font-semibold text-text">{badge.name}</p>
        <p className="mt-0.5 text-xs text-text-muted">{badge.description}</p>
      </div>
    </motion.div>
  );
}

export function AchievementsPreview(): React.JSX.Element {
  return (
    <section data-tour="badges-preview">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          What you&apos;ll earn
        </p>
        <PreviewBadge />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {SAMPLE_BADGES.map((badge, i) => (
          <SampleCard key={badge.name} badge={badge} index={i} />
        ))}
      </div>
    </section>
  );
}
