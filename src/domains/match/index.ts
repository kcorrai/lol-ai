export { getMatchDetail } from "@/domains/match/services/matchService";
export type {
  MatchDetail,
  ParticipantDetail,
  AiInsight,
  TeamObjectives,
} from "@/domains/match/services/matchService";
export { explainBuild } from "@/domains/match/services/buildExplanationService";
export type {
  BuildExplanation,
  ItemExplanation,
} from "@/domains/match/types/buildExplanation.types";
export { getLanePhase, getLanePhaseForUser } from "@/domains/match/services/lanePhaseService";
export type {
  LanePhase,
  LanePhasePoint,
  LanePhaseMarker,
  LanePhaseOpponent,
} from "@/domains/match/types/lanePhase.types";
export { getMatchStoryForUser } from "@/domains/match/services/matchStoryService";
export type {
  MatchStory,
  MatchStoryAvailable,
  MatchStoryUnavailable,
  MatchStoryParticipant,
  MatchStoryFrame,
  MatchStoryFramePlayer,
  MatchStoryTeamTotal,
  MatchStoryEvent,
  StoryEventKind,
} from "@/domains/match/types/matchStory.types";
// The Discord bot renders a match summary the riot domain builds, and this is
// the one place in the codebase that names a queue for a human.
export { queueLabel } from "@/domains/match/archive/archiveLabels";
