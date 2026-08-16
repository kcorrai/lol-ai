// Public API of the esports domain — free, public, cache-backed esports data.
// Nothing outside this domain imports a service file directly (ADR-016).

export {
  getLeagues,
  getLeague,
  getTournamentsForLeague,
  getCurrentTournament,
  pickCurrentTournament,
  prominentLeagues,
} from "@/domains/esports/services/leagueService";
export { getStandings, primaryTable } from "@/domains/esports/services/standingsService";
export { getMatch, defaultGame } from "@/domains/esports/services/matchService";
export { getGameStats } from "@/domains/esports/services/gameStatsService";
export {
  getProMeta,
  getProBuild,
  getCachedProBuild,
  getProChampionIds,
} from "@/domains/esports/services/proMetaService";
export type { ProMetaQuery, ProBuildResult } from "@/domains/esports/services/proMetaService";
export { aggregateProMeta, MIN_MEANINGFUL_GAMES } from "@/domains/esports/proMeta";
export { aggregateProBuilds, MIN_BUILD_ITEM_GOLD } from "@/domains/esports/proBuild";
export type { BuildItemCatalogue, BuildItemFacts } from "@/domains/esports/proBuild";
export { sortChampions, parseProMetaSort, PRO_META_SORTS } from "@/domains/esports/proMetaSort";
export type { ProMetaSort } from "@/domains/esports/proMetaSort";
export { gameWinner } from "@/domains/esports/gameOutcome";
export {
  getPlayer,
  getPlayerIndex,
  getPlayerGames,
  getTeamPlayerEntries,
  buildPlayerIndex,
  playerSlug,
  championPool,
} from "@/domains/esports/services/playerService";
export {
  getUpcoming,
  getCompleted,
  getLiveEvents,
  getEventStartTime,
} from "@/domains/esports/services/scheduleService";
export type { ScheduleQuery } from "@/domains/esports/services/scheduleService";
export { esportsSitemapEntries } from "@/domains/esports/services/sitemapService";
export type { EsportsSitemapEntry } from "@/domains/esports/services/sitemapService";
export { ROLE_LABEL, roleLabel } from "@/domains/esports/roles";
export { httpsAsset } from "@/domains/esports/services/esportsApi";
export type {
  BracketMatch,
  ProChampionStat,
  ProChampionBuild,
  ProGameAppearance,
  ProPlayerOnChampion,
  ItemFrequency,
  RuneVariant,
  SampledGame,
  ProMeta,
  PlayerChampionStat,
  PlayerEntry,
  PlayerGame,
  GameParticipant,
  GameStats,
  GameTeamStats,
  MatchDetail,
  MatchGameRef,
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
  teamSlugsById,
} from "@/domains/esports/services/teamService";
