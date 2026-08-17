-- CreateEnum
CREATE TYPE "CoachStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('VOD_REVIEW', 'LIVE_SESSION', 'LIVE_SPECTATE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_COACH', 'CONFIRMED', 'DECLINED', 'EXPIRED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_COACH', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutAccountStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED_REFUND', 'RESOLVED_RELEASE', 'REJECTED');

-- CreateEnum
CREATE TYPE "RankProofMethod" AS ENUM ('SELF_REPORTED', 'PLATFORM_CHECKED', 'RIOT_VERIFIED');

-- CreateEnum
CREATE TYPE "ReviewAuthorRole" AS ENUM ('STUDENT', 'COACH');

-- CreateEnum
CREATE TYPE "AnnotationCategory" AS ENUM ('LANING', 'MACRO', 'MICRO', 'VISION', 'DRAFT', 'POSITIONING', 'MENTAL');

-- CreateTable
CREATE TABLE "coach_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "slug" TEXT,
    "status" "CoachStatus" NOT NULL DEFAULT 'DRAFT',
    "displayName" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "languages" TEXT[],
    "regions" TEXT[],
    "roles" "Position"[],
    "championIds" INTEGER[],
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "commissionBps" INTEGER NOT NULL DEFAULT 2000,
    "acceptingStudents" BOOLEAN NOT NULL DEFAULT true,
    "ratingBayes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingWilson" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_rank_proofs" (
    "id" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "riotAccountId" UUID,
    "method" "RankProofMethod" NOT NULL,
    "queueType" "QueueType" NOT NULL,
    "tier" "RankTier" NOT NULL,
    "division" "RankDivision" NOT NULL,
    "leaguePoints" INTEGER NOT NULL DEFAULT 0,
    "peakTier" "RankTier",
    "peakDivision" "RankDivision",
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staleAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_rank_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_listings" (
    "id" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "kind" "SessionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deliveryHours" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_availability" (
    "id" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "days" INTEGER[],
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_availability_exceptions" (
    "id" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT true,
    "overrideStartTime" TIME,
    "overrideEndTime" TIME,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "kind" "SessionKind" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_COACH',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "studentTimezone" TEXT NOT NULL,
    "coachTimezone" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "commissionBps" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "coachEarningsCents" INTEGER NOT NULL,
    "riotAccountId" UUID,
    "matchIds" TEXT[],
    "vodUrl" TEXT,
    "studentGoal" TEXT NOT NULL,
    "meetingUrl" TEXT,
    "meetingProvider" TEXT NOT NULL DEFAULT 'external',
    "respondByAt" TIMESTAMP(3) NOT NULL,
    "cancellationHours" INTEGER NOT NULL,
    "autoCompleteAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_events" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "actorId" UUID,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vod_reviews" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "matchId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vod_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vod_annotations" (
    "id" UUID NOT NULL,
    "vodReviewId" UUID NOT NULL,
    "timestampSeconds" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "AnnotationCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vod_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_reviews" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "authorRole" "ReviewAuthorRole" NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "revealedAt" TIMESTAMP(3),
    "coachReply" TEXT,
    "coachRepliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "bookingId" UUID,
    "body" TEXT NOT NULL,
    "wasRedacted" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_payments" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "amountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "coachAmountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "providerPaymentId" TEXT,
    "providerTransferId" TEXT,
    "capturedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_payout_accounts" (
    "id" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "providerAccountId" TEXT,
    "status" "PayoutAccountStatus" NOT NULL DEFAULT 'NONE',
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_disputes" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "openedById" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "resolvedById" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coach_profiles_userId_key" ON "coach_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coach_profiles_slug_key" ON "coach_profiles"("slug");

-- CreateIndex
CREATE INDEX "coach_profiles_status_ratingWilson_idx" ON "coach_profiles"("status", "ratingWilson" DESC);

-- CreateIndex
CREATE INDEX "coach_profiles_status_acceptingStudents_idx" ON "coach_profiles"("status", "acceptingStudents");

-- CreateIndex
CREATE INDEX "coach_rank_proofs_staleAt_idx" ON "coach_rank_proofs"("staleAt");

-- CreateIndex
CREATE UNIQUE INDEX "coach_rank_proofs_coachProfileId_queueType_key" ON "coach_rank_proofs"("coachProfileId", "queueType");

-- CreateIndex
CREATE INDEX "coach_listings_coachProfileId_isActive_sortOrder_idx" ON "coach_listings"("coachProfileId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "coach_availability_coachProfileId_isActive_idx" ON "coach_availability"("coachProfileId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "coach_availability_exceptions_coachProfileId_date_key" ON "coach_availability_exceptions"("coachProfileId", "date");

-- CreateIndex
CREATE INDEX "bookings_coachProfileId_status_startTime_idx" ON "bookings"("coachProfileId", "status", "startTime");

-- CreateIndex
CREATE INDEX "bookings_studentId_createdAt_idx" ON "bookings"("studentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "bookings_status_respondByAt_idx" ON "bookings"("status", "respondByAt");

-- CreateIndex
CREATE INDEX "bookings_status_autoCompleteAt_idx" ON "bookings"("status", "autoCompleteAt");

-- CreateIndex
CREATE INDEX "booking_events_bookingId_createdAt_idx" ON "booking_events"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vod_reviews_bookingId_key" ON "vod_reviews"("bookingId");

-- CreateIndex
CREATE INDEX "vod_annotations_vodReviewId_timestampSeconds_idx" ON "vod_annotations"("vodReviewId", "timestampSeconds");

-- CreateIndex
CREATE INDEX "session_reviews_coachProfileId_revealedAt_idx" ON "session_reviews"("coachProfileId", "revealedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "session_reviews_bookingId_authorRole_key" ON "session_reviews"("bookingId", "authorRole");

-- CreateIndex
CREATE INDEX "conversations_studentId_lastMessageAt_idx" ON "conversations"("studentId", "lastMessageAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_coachProfileId_studentId_key" ON "conversations"("coachProfileId", "studentId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "booking_payments_bookingId_key" ON "booking_payments"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_payments_providerPaymentId_key" ON "booking_payments"("providerPaymentId");

-- CreateIndex
CREATE INDEX "booking_payments_status_idx" ON "booking_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "coach_payout_accounts_coachProfileId_key" ON "coach_payout_accounts"("coachProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_disputes_bookingId_key" ON "booking_disputes"("bookingId");

-- CreateIndex
CREATE INDEX "booking_disputes_status_createdAt_idx" ON "booking_disputes"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "coach_profiles" ADD CONSTRAINT "coach_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_profiles" ADD CONSTRAINT "coach_profiles_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_rank_proofs" ADD CONSTRAINT "coach_rank_proofs_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_rank_proofs" ADD CONSTRAINT "coach_rank_proofs_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_listings" ADD CONSTRAINT "coach_listings_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_availability" ADD CONSTRAINT "coach_availability_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_availability_exceptions" ADD CONSTRAINT "coach_availability_exceptions_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "coach_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vod_reviews" ADD CONSTRAINT "vod_reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vod_annotations" ADD CONSTRAINT "vod_annotations_vodReviewId_fkey" FOREIGN KEY ("vodReviewId") REFERENCES "vod_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_reviews" ADD CONSTRAINT "session_reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_reviews" ADD CONSTRAINT "session_reviews_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_reviews" ADD CONSTRAINT "session_reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_payout_accounts" ADD CONSTRAINT "coach_payout_accounts_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
