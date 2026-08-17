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

export {
  DEFAULT_COMMISSION_BPS,
  COACH_RESPONSE_HOURS,
  DEFAULT_CANCELLATION_HOURS,
  MAX_CANCELLATION_HOURS,
  DISPUTE_WINDOW_HOURS,
  REVIEW_BLIND_DAYS,
  MIN_REVIEWS_FOR_SCORE,
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
