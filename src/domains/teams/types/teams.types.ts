import type { TeamRole } from "@prisma/client";

export type { TeamRole };

export interface TeamSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  ownerId: string;
  memberCount: number;
  myRole: TeamRole;
  createdAt: string;
}

export interface TeamMemberRow {
  id: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  gameName: string | null;
  tagLine: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface TeamMemberSummary {
  userId: string;
  memberId: string;
  role: TeamRole;
  gameName: string;
  tagLine: string;
  profileSlug: string | null;
  rank: { tier: string; division: string; lp: number } | null;
  topChampion: string | null;
  lastMatchResult: "WIN" | "LOSS" | null;
  lastMatchChampion: string | null;
  lastReportId: string | null;
  lastReportScore: number | null;
  winRate7d: number | null;
  avgKDA7d: number | null;
  avgCSPerMinute7d: number | null;
  avgVisionScore7d: number | null;
}

export interface TeamDashboardData {
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
    memberCount: number;
    maxMembers: number;
    avgWinRate7d: number | null;
  };
  members: TeamMemberSummary[];
}

export interface CreateTeamInput {
  name: string;
  logoUrl?: string;
}

export interface InviteMemberInput {
  email: string;
  role: TeamRole;
}

export interface PendingInvite {
  id: string;
  email: string | null;
  role: TeamRole;
  expiresAt: string;
  createdAt: string;
}
