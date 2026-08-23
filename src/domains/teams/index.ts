export { createTeam, getMyTeams, assertCoachAccess } from "@/domains/teams/services/teamService";
export { getTeamDashboard } from "@/domains/teams/services/teamDashboardService";
export { inviteMember, acceptInvite } from "@/domains/teams/services/teamInviteService";
export type {
  TeamSummary,
  TeamDashboardData,
  TeamMemberSummary,
} from "@/domains/teams/types/teams.types";
