// Server-side public API of the draft domain. Kept separate from `index.ts` on
// purpose: the engine is imported by client components, and a single barrel
// would drag Prisma and the Redis client into the browser bundle with it.
export {
  createSeries,
  getSeries,
  getSeriesForGame,
  resolveViewer,
  setBlueTeam,
  setGameResult,
  setReady,
  submitAction,
  undoAction,
} from "@/domains/draft/services/draftSeriesService";
export type {
  CreateSeriesInput,
  CreateSeriesResult,
  ServiceResult,
} from "@/domains/draft/services/draftSeriesService";
export type { DraftSeriesRecord, ViewerRole } from "@/domains/draft/services/draftRecord";
export { getChampionPool } from "@/domains/draft/services/draftChampionPool";
export { deleteExpiredSeries } from "@/domains/draft/services/draftRepository";
