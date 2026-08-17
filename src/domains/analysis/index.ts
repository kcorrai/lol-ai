// Public API of the analysis domain — the sanctioned entry point for other
// domains (CLAUDE.md §4). Deliberately narrow: only what another domain has a
// reason to call belongs here.

export { awardXp } from "./services/challengeProgressService";
export { XP_PER_LEVEL } from "./services/challengeConstants";
