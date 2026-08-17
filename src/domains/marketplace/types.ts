import type {
  AnnotationCategory,
  BookingStatus,
  CoachStatus,
  Position,
  RankDivision,
  RankProofMethod,
  RankTier,
  SessionKind,
} from "@prisma/client";

// The shapes this domain hands out. Ours, not Prisma's: a route handler that
// serialises a Prisma row directly leaks column names into the public API and
// makes every later schema change a breaking one.

/** What a coach's rank badge actually claims, and how well founded it is. */
export interface RankBadge {
  method: RankProofMethod;
  tier: RankTier;
  division: RankDivision;
  leaguePoints: number;
  peakTier: RankTier | null;
  peakDivision: RankDivision | null;
  /** ISO. What the badge is dated — a rank read in March is not a claim for August. */
  checkedAt: string;
  /** True once `staleAt` has passed and the badge should be shown as unrefreshed. */
  stale: boolean;
}

/** One thing a coach sells. */
export interface Listing {
  id: string;
  kind: SessionKind;
  title: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  /** Async only: the promised turnaround. Null for the scheduled kinds. */
  deliveryHours: number | null;
}

/** A coach as they appear on a search card — deliberately smaller than the profile. */
export interface CoachCard {
  slug: string;
  displayName: string;
  headline: string;
  languages: string[];
  regions: string[];
  roles: Position[];
  championIds: number[];
  badge: RankBadge | null;
  /** Null until the coach has enough revealed reviews to show a number at all. */
  rating: number | null;
  ratingCount: number;
  sessionsCompleted: number;
  /** The cheapest active listing, which is what a card advertises. */
  fromPriceCents: number | null;
  currency: string;
  acceptingStudents: boolean;
}

/** The full public profile at `/coaches/[slug]`. */
export interface CoachPublicProfile extends CoachCard {
  bio: string;
  timezone: string;
  listings: Listing[];
  reviews: PublicReview[];
}

/** A revealed review, as shown on a profile. */
export interface PublicReview {
  id: string;
  rating: number;
  body: string | null;
  authorName: string;
  createdAt: string;
  coachReply: string | null;
  coachRepliedAt: string | null;
}

/** What the coach sees about their own application while it is being reviewed. */
export interface CoachApplicationState {
  status: CoachStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  /** Only ever set on REJECTED — a coach is owed the reason. */
  reviewNote: string | null;
  slug: string | null;
}

/** A free window a student can book into, already resolved to instants. */
export interface Slot {
  /** ISO, UTC. */
  start: string;
  /** ISO, UTC. */
  end: string;
}

/** A booking as either side sees it in their own list. */
export interface BookingSummary {
  id: string;
  kind: SessionKind;
  status: BookingStatus;
  /** Null for the unscheduled kind. ISO, UTC. */
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  coachSlug: string;
  coachDisplayName: string;
  studentName: string;
  listingTitle: string;
  /** ISO. When an unanswered request gives up on itself. */
  respondByAt: string;
  createdAt: string;
}

/** One timestamped note on a VOD review. */
export interface Annotation {
  id: string;
  timestampSeconds: number;
  title: string;
  body: string;
  category: AnnotationCategory;
}

/** The async deliverable, as the student receives it. */
export interface VodReviewDelivery {
  bookingId: string;
  summary: string;
  sourceUrl: string | null;
  matchId: string | null;
  publishedAt: string | null;
  annotations: Annotation[];
}

/** Everything a search can be narrowed by. All optional; all AND-ed together. */
export interface CoachSearchQuery {
  role?: Position;
  language?: string;
  region?: string;
  kind?: SessionKind;
  championId?: number;
  maxPriceCents?: number;
  minTier?: RankTier;
  /** Only coaches taking new students. Defaults to true. */
  availableOnly?: boolean;
  sort?: CoachSort;
  cursor?: string;
  limit?: number;
}

export type CoachSort = "rating" | "price_asc" | "price_desc" | "newest";

export interface CoachSearchResult {
  coaches: CoachCard[];
  nextCursor: string | null;
  total: number;
}
