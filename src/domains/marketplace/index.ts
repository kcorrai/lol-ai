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
  compareRanks,
  higherRank,
  isApex,
  rankScore,
  tiersAtOrAbove,
  formatRank,
} from "@/domains/marketplace/rank";
export type { Rank } from "@/domains/marketplace/rank";

export {
  checkRank,
  refreshStaleBadges,
} from "@/domains/marketplace/services/rankVerificationService";
export type { CheckOutcome } from "@/domains/marketplace/services/rankVerificationService";

export {
  getBadge,
  badgesFor,
  coachBadgeAndAccounts,
} from "@/domains/marketplace/services/rankBadgeService";
export type { CheckableAccount } from "@/domains/marketplace/services/rankBadgeService";

export {
  getOwnProfile,
  hasCoachProfile,
  ownCoachProfileId,
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
  listCoaches,
  getCoachBySlug,
  getCoachProfilePage,
} from "@/domains/marketplace/services/coachSearchService";

export {
  searchCoaches,
  sortPageByPrice,
} from "@/domains/marketplace/services/coachDiscoveryService";

export { computeFreeSlots, openWindows } from "@/domains/marketplace/slots";
export type { WeeklyRule, DateException, SlotRequest } from "@/domains/marketplace/slots";

export { merge, subtractAll, subtractOne } from "@/domains/marketplace/intervals";
export type { Interval } from "@/domains/marketplace/intervals";

export {
  wallTimeIn,
  offsetMsAt,
  instantFromWallTime,
  existsInZone,
  isValidTimeZone,
  localDatesBetween,
} from "@/domains/marketplace/timezone";
export type { WallTime } from "@/domains/marketplace/timezone";

export {
  getAvailability,
  replaceRules,
  upsertException,
  deleteException,
  isSchedulableTimeZone,
  timeToMinutes,
  minutesToTime,
  dateToKey,
  keyToDate,
} from "@/domains/marketplace/services/availabilityService";
export type {
  AvailabilityView,
  RuleInput,
  ExceptionInput,
  AvailabilityOutcome,
} from "@/domains/marketplace/services/availabilityService";

export { freeSlots, isSlotFree, coachSlotsBySlug } from "@/domains/marketplace/services/slotService";

export { createBooking } from "@/domains/marketplace/services/bookingService";
export type { BookingRequest, CreateOutcome } from "@/domains/marketplace/services/bookingService";

export {
  acceptBooking,
  declineBooking,
  cancelBooking,
  markDelivered,
  confirmDelivery,
} from "@/domains/marketplace/services/bookingLifecycleService";

export {
  setMeetingUrl,
  performBookingCommand,
} from "@/domains/marketplace/services/bookingCommandService";

export {
  autoComplete,
  expireBooking,
} from "@/domains/marketplace/services/bookingSweepService";

export {
  runBookingSweeps,
  expireUnanswered,
  completeUnchallenged,
} from "@/domains/marketplace/services/bookingSweeps";
export type { SweepReport } from "@/domains/marketplace/services/bookingSweeps";
export type {
  LifecycleOutcome,
  ActorRole,
} from "@/domains/marketplace/services/bookingLifecycleService";
export type { BookingCommand } from "@/domains/marketplace/services/bookingCommandService";

export { transition, recordCreation, bookingHistory } from "@/domains/marketplace/services/bookingEventService";
export type { TransitionInput, TransitionOutcome } from "@/domains/marketplace/services/bookingEventService";

export {
  getReview,
  saveReview,
  publishReview,
} from "@/domains/marketplace/services/vodReviewService";
export type { AnnotationInput, VodOutcome } from "@/domains/marketplace/services/vodReviewService";

export { ANNOTATION_CATEGORIES, secondsToClock, clockToSeconds } from "@/domains/marketplace/vodClock";

export {
  listThreads,
  getThread,
  openThread,
  sendMessage,
} from "@/domains/marketplace/services/messagingService";
export type {
  MessageView,
  ThreadView,
  ThreadSummary,
  SendOutcome,
} from "@/domains/marketplace/services/messagingService";

export {
  leaveReview,
  revealIfReady,
  revealExpired,
  refreshCoachRating,
  publicReviews,
  replyToReview,
} from "@/domains/marketplace/services/reviewService";
export type { ReviewOutcome } from "@/domains/marketplace/services/reviewService";

export {
  bayesianAverage,
  wilsonLowerBound,
  aggregateRatings,
} from "@/domains/marketplace/rating";
export type { RatingAggregate } from "@/domains/marketplace/rating";

export { redactContacts, redactionNotice } from "@/domains/marketplace/redact";
export type { RedactionResult } from "@/domains/marketplace/redact";

export {
  openDispute,
  listDisputes,
  resolveDispute,
} from "@/domains/marketplace/services/disputeService";
export type { DisputeRow, DisputeOutcome } from "@/domains/marketplace/services/disputeService";

export {
  notify,
  listNotifications,
  markNotificationsRead,
} from "@/domains/marketplace/services/notificationService";
export type {
  MarketplaceNotification,
  NotificationView,
} from "@/domains/marketplace/services/notificationService";

export { sendSessionReminders } from "@/domains/marketplace/services/reminderService";

export { sessionPrep } from "@/domains/marketplace/services/sessionPrepService";
export { spectateStatus } from "@/domains/marketplace/services/spectateService";
export type { SpectateStatus } from "@/domains/marketplace/services/spectateService";
export type { SessionPrep } from "@/domains/marketplace/services/sessionPrepService";

export { listBookings, getBookingFor, coachWorkload } from "@/domains/marketplace/services/bookingQueryService";
export type { CoachWorkload } from "@/domains/marketplace/services/bookingQueryService";

export { coachConsoleStats } from "@/domains/marketplace/services/coachStatsService";
export type {
  CoachConsoleStats,
  EarningsWeek,
} from "@/domains/marketplace/services/coachStatsService";

export {
  openPayment,
  settleForStatus,
  paymentFor,
  setPaymentProvider,
  currentPaymentProvider,
} from "@/domains/marketplace/services/payments/paymentService";
export { manualProvider } from "@/domains/marketplace/services/payments/manualProvider";
export type {
  PaymentProvider,
  ChargeRequest,
  ChargeResult,
  ReleaseResult,
  RefundResult,
} from "@/domains/marketplace/services/payments/paymentProvider";
export type { SlotQuery } from "@/domains/marketplace/services/slotService";

export { marketplaceSitemapEntries } from "@/domains/marketplace/services/marketplaceSitemapService";
export type { MarketplaceSitemapEntry } from "@/domains/marketplace/services/marketplaceSitemapService";

export { coachProfileJsonLd, coachesIndexJsonLd } from "@/domains/marketplace/jsonLd";

export {
  parseSearchQuery,
  buildSearchParams,
  canonicalPath,
  isFiltered,
  pageOf,
  PAGE_SIZE,
  SORTS,
} from "@/domains/marketplace/searchQuery";

export {
  listOwnListings,
  publicListings,
  createListing,
  updateListing,
  setListingActive,
  deleteListing,
} from "@/domains/marketplace/services/serviceListingService";
export type {
  ListingInput,
  ListingOutcome,
} from "@/domains/marketplace/services/serviceListingService";

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
  BookingDetail,
  BookingEventRow,
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
