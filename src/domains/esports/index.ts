// Public API of the esports domain — free, public, cache-backed esports data.
// Nothing outside this domain imports a service file directly (ADR-016).

export {
  getLeagues,
  getLeague,
  getTournamentsForLeague,
} from "@/domains/esports/services/leagueService";
export {
  getUpcoming,
  getCompleted,
  getLiveEvents,
} from "@/domains/esports/services/scheduleService";
export type { ScheduleQuery } from "@/domains/esports/services/scheduleService";
export { httpsAsset } from "@/domains/esports/services/esportsApi";
export type {
  EsportsEvent,
  EsportsEventLeague,
  EsportsEventTeam,
  EsportsLeague,
  EsportsTournament,
  EventState,
  LeagueDisplayStatus,
  MatchOutcome,
} from "@/domains/esports/types";
