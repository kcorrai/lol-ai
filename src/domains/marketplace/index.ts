// Public API of the coach marketplace — human coaches, sold by the session.
//
// Nothing outside this domain imports a file inside it directly (ADR-019), the
// same rule the esports domain follows. Two things this domain does not do, and
// they are load-bearing rather than incidental:
//
//   - It calls no AI provider and reads no AI table. The value on offer here is
//     a person; a generated report is a different product and lives under
//     `src/domains/coaching/`.
//   - It moves no money. `paymentService` keeps a ledger and a state machine,
//     and the only driver today settles nothing (ADR-020).
//
// **Server side only.** This file re-exports the services, which import Prisma,
// so a *value* imported through it from a client component ships the database
// client to the browser and the page fails to compile. Components in this
// domain import `policy.ts`, `types.ts` and the rest on their direct paths;
// the barrel exists for route handlers and other domains.

export {
  DEFAULT_COMMISSION_BPS,
  COACH_RESPONSE_HOURS,
  DEFAULT_CANCELLATION_HOURS,
  MAX_CANCELLATION_HOURS,
  DISPUTE_WINDOW_HOURS,
  REVIEW_BLIND_DAYS,
  MIN_REVIEWS_FOR_SCORE,
  MIN_BIO_LENGTH,
  MIN_PRICE_CENTS,
  MAX_PRICE_CENTS,
  MIN_DURATION_MINUTES,
  MAX_DURATION_MINUTES,
  isScheduled,
  splitPrice,
  respondByFrom,
  autoCompleteFrom,
  reviewRevealDeadlineFrom,
  canCancelFreely,
} from "@/domains/marketplace/policy";
export type { PriceSplit } from "@/domains/marketplace/policy";

export {
  canTransition,
  isTerminal,
  nextStatuses,
  holdsFunds,
  refundsAutomatically,
  isReviewable,
} from "@/domains/marketplace/transitions";

export { slugify, isReserved, pickSlug } from "@/domains/marketplace/slug";

export {
  getOwnProfile,
  isApprovedCoach,
  approvedCoachProfileId,
  saveOwnProfile,
  setAcceptingStudents,
} from "@/domains/marketplace/services/coachProfileService";
export type {
  CoachProfileInput,
  OwnCoachProfile,
  SaveOutcome,
} from "@/domains/marketplace/services/coachProfileService";

export {
  submitApplication,
  withdrawApplication,
  firstMissingField,
} from "@/domains/marketplace/services/coachApplicationService";
export type { SubmitOutcome } from "@/domains/marketplace/services/coachApplicationService";

export {
  listApplications,
  pendingCount,
  approveApplication,
  rejectApplication,
  suspendCoach,
  reinstateCoach,
} from "@/domains/marketplace/services/coachReviewService";
export type {
  ApplicationRow,
  DecisionOutcome,
} from "@/domains/marketplace/services/coachReviewService";

export type {
  Annotation,
  BookingSummary,
  CoachApplicationState,
  CoachCard,
  CoachPublicProfile,
  CoachSearchQuery,
  CoachSearchResult,
  CoachSort,
  Listing,
  PublicReview,
  RankBadge,
  Slot,
  VodReviewDelivery,
} from "@/domains/marketplace/types";
