// Public API of the esports domain — free, public, cache-backed esports data.
// Nothing outside this domain imports a service file directly (ADR-016).

export {
  getLeagues,
  getLeague,
  getTournamentsForLeague,
  getCurrentTournament,
  pickCurrentTournament,
  prominentLeagues,
  getTournament,
  getTournamentIndex,
} from "@/domains/esports/services/leagueService";
export type { TournamentEntry } from "@/domains/esports/services/leagueService";
export { getStandings, primaryTable } from "@/domains/esports/services/standingsService";
export { getMatch, defaultGame } from "@/domains/esports/services/matchService";
export { getGameStats } from "@/domains/esports/services/gameStatsService";
export { getGameTimeline } from "@/domains/esports/services/timelineService";
export { goldDiff, objectiveEvents, peakLead, sampleClock } from "@/domains/esports/timeline";
export type { ObjectiveEvent, ObjectiveKind } from "@/domains/esports/timeline";
export {
  getProMeta,
  getProBuild,
  getCachedProBuild,
  getProChampionIds,
  getCachedProChampionIds,
  getProPresence,
} from "@/domains/esports/services/proMetaService";
export type { ProMetaQuery, ProBuildResult } from "@/domains/esports/services/proMetaService";
export { aggregateProMeta, MIN_MEANINGFUL_GAMES } from "@/domains/esports/proMeta";
export { aggregateProBuilds, MIN_BUILD_ITEM_GOLD } from "@/domains/esports/proBuild";
export type { BuildItemCatalogue, BuildItemFacts } from "@/domains/esports/proBuild";
export { sortChampions, parseProMetaSort, PRO_META_SORTS } from "@/domains/esports/proMetaSort";
export type { ProMetaSort } from "@/domains/esports/proMetaSort";
export { filterByRole, parseProMetaRole, PRO_META_ROLES } from "@/domains/esports/proMetaRole";
export { gameWinner } from "@/domains/esports/gameOutcome";
export { teamsPlayingSoon } from "@/domains/esports/playingSoon";
export type { PlayingTeam } from "@/domains/esports/playingSoon";
export { headToHead } from "@/domains/esports/headToHead";
export type { HeadToHeadMeeting, HeadToHeadRecord, TeamKey } from "@/domains/esports/headToHead";
export {
  elapsedSeconds,
  formatDuration,
  meanDuration,
  perMinute,
} from "@/domains/esports/duration";
export { bracketLayout, bracketWinner } from "@/domains/esports/bracket";
export type { BracketLayout, BracketRound } from "@/domains/esports/bracket";
export {
  vodLink,
  vodLinks,
  streamLink,
  streamLinks,
  archiveLink,
  inferVodProvider,
} from "@/domains/esports/watch";
export { getVodArchive, archiveLeagues } from "@/domains/esports/services/vodArchiveService";
export type { WatchLink } from "@/domains/esports/watch";
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
  ArchivedGame,
  BracketMatch,
  FinalStatLine,
  GameVod,
  VodSeries,
  EventStream,
  ProChampionStat,
  ProPresence,
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
  GameTimeline,
  TimelineSample,
  TimelineTeamState,
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
  FollowedTeamEntry,
  EsportsTournament,
  EventState,
  LeagueDisplayStatus,
  MatchOutcome,
  StandingsRow,
  StandingsStage,
} from "@/domains/esports/types";
export {
  listFollows,
  followedTeamIds,
  followTeam,
  unfollowTeam,
  followsWithTeams,
  MAX_FOLLOWS,
} from "@/domains/esports/services/followService";
export type { FollowOutcome } from "@/domains/esports/services/followService";
export {
  getTeams,
  getTeam,
  getTeamMatches,
  indexableTeams,
  isThinTeam,
  recentForm,
  teamSlugsById,
} from "@/domains/esports/services/teamService";
