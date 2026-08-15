// Public API of the esports domain — free, public, cache-backed esports data.
// Nothing outside this domain imports a service file directly (ADR-016).

export {
  getLeagues,
  getLeague,
  getTournamentsForLeague,
  getCurrentTournament,
  pickCurrentTournament,
} from "@/domains/esports/services/leagueService";
export { getStandings, primaryTable } from "@/domains/esports/services/standingsService";
export {
  getUpcoming,
  getCompleted,
  getLiveEvents,
} from "@/domains/esports/services/scheduleService";
export type { ScheduleQuery } from "@/domains/esports/services/scheduleService";
export { httpsAsset } from "@/domains/esports/services/esportsApi";
export type {
  BracketMatch,
  EsportsPlayer,
  EsportsTeam,
  PlayerRole,
  TeamStatus,
  BracketTeam,
  EsportsEvent,
  EsportsEventLeague,
  EsportsEventTeam,
  EsportsLeague,
  EsportsTeamRef,
  EsportsTournament,
  EventState,
  LeagueDisplayStatus,
  MatchOutcome,
  StandingsRow,
  StandingsStage,
} from "@/domains/esports/types";
export {
  getTeams,
  getTeam,
  getTeamMatches,
  indexableTeams,
  isThinTeam,
  recentForm,
} from "@/domains/esports/services/teamService";
