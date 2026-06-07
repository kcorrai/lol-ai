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
  rank: string | null;
  lastMatchResult: "WIN" | "LOSS" | null;
  lastMatchChampion: string | null;
  lastReportId: string | null;
  lastReportScore: number | null;
  winRate7d: number | null;
}

export interface TeamDashboardData {
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
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
