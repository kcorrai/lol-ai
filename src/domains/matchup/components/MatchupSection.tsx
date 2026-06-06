"use client";

import type { MatchupAnalysis } from "../types/matchup.types";
import { MatchupLaneTab } from "./MatchupLaneTab";
import { MatchupTradeTab } from "./MatchupTradeTab";
import { MatchupBuildTab } from "./MatchupBuildTab";
import { MatchupMistakesTab } from "./MatchupMistakesTab";

export type MatchupTab = "lane" | "trade" | "build" | "mistakes";

interface MatchupSectionProps {
  tab: MatchupTab;
  data: MatchupAnalysis;
}

export function MatchupSection({ tab, data }: MatchupSectionProps) {
  if (tab === "lane") return <MatchupLaneTab data={data} />;
  if (tab === "trade") return <MatchupTradeTab data={data} />;
  if (tab === "build") return <MatchupBuildTab data={data} />;
  return <MatchupMistakesTab data={data} />;
}
