import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getTeamDashboard } from "@/domains/teams/services/teamService";
import { logger } from "@/lib/utils/logger";
import type { TeamDashboardData, TeamMemberSummary } from "@/domains/teams/types/teams.types";

export interface TeamReportData {
  teamName: string;
  generatedAt: string;
  overview: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  mvp: string | null;
  focusPlayer: string | null;
  memberHighlights: { gameName: string; insight: string }[];
}

function memberSummary(m: TeamMemberSummary): string {
  const rank = m.rank ? `${m.rank.tier} ${m.rank.division} ${m.rank.lp}LP` : "Unranked";
  const wr = m.winRate7d !== null ? `WR:${m.winRate7d}%` : "WR:N/A";
  const kda = m.avgKDA7d !== null ? `KDA:${m.avgKDA7d}` : "KDA:N/A";
  const champ = m.topChampion ?? "Unknown";
  return `- ${m.gameName}#${m.tagLine} | ${rank} | ${wr} | ${kda} | Champion: ${champ}`;
}

function buildPrompt(data: TeamDashboardData): string {
  const memberLines = data.members.map(memberSummary).join("\n");
  const teamWR = data.team.avgWinRate7d !== null ? `${data.team.avgWinRate7d}%` : "N/A";

  return `You are an expert League of Legends team coach. Analyze this team's performance data and respond ONLY with a valid JSON object — no markdown, no explanation.

Team: ${data.team.name} (${data.members.length} members, avg 7-day win rate: ${teamWR})

Members:
${memberLines}

Respond with exactly this JSON structure:
{
  "overview": "<2-3 sentences: overall team health and key finding>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "recommendations": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>", "<actionable tip 4>"],
  "mvp": "<gameName of best performer, or null>",
  "focusPlayer": "<gameName of player needing most improvement, or null>",
  "memberHighlights": [{"gameName":"<name>","insight":"<1 sentence>"}]
}

Write in Turkish. Be specific, data-driven, and direct.`;
}

function parseReport(raw: string, teamName: string): TeamReportData {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Omit<TeamReportData, "teamName" | "generatedAt">;
  return {
    teamName,
    generatedAt: new Date().toISOString(),
    overview: parsed.overview ?? "",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    mvp: parsed.mvp ?? null,
    focusPlayer: parsed.focusPlayer ?? null,
    memberHighlights: Array.isArray(parsed.memberHighlights) ? parsed.memberHighlights : [],
  };
}

export function teamReportCacheKey(teamId: string): string {
  return buildCacheKey("team-report", { teamId });
}

export async function getTeamReport(teamId: string): Promise<TeamReportData | null> {
  const cacheKey = teamReportCacheKey(teamId);
  const cached = await getCached(cacheKey);
  if (cached) return cached as TeamReportData;
  return null;
}

export async function generateTeamReport(
  teamId: string,
  userId: string
): Promise<TeamReportData> {
  const dashboard = await getTeamDashboard(teamId, userId);

  if (dashboard.members.length === 0) {
    throw new Error("Takımda henüz üye yok — rapor oluşturulamaz.");
  }

  const prompt = buildPrompt(dashboard);
  const ai = getAiClient("full");

  logger.info("[teamReport] generating report", { teamId, memberCount: dashboard.members.length });

  const result = await ai.complete(
    "You are a professional LoL esports coach analyst. Always respond with valid JSON only.",
    prompt,
    { maxTokens: 1200, temperature: 0.4 }
  );

  const report = parseReport(result.content, dashboard.team.name);
  const cacheKey = teamReportCacheKey(teamId);
  await setCached(cacheKey, "team-report", report, 1);

  logger.info("[teamReport] report generated and cached", { teamId, tokens: result.totalTokens });
  return report;
}
