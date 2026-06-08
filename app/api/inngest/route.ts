import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runCoachingJob } from "@/inngest/functions/runCoachingJob";
import { matchSyncWorker } from "@/inngest/functions/matchSync";
import { autoSessionReview } from "@/inngest/functions/autoSessionReview";
import { sendRankChangeEmail } from "@/inngest/functions/sendRankChangeEmail";
import { sendWeeklyReportEmails } from "@/inngest/functions/sendWeeklyReportEmails";
import { tiltStreakCheck } from "@/inngest/functions/tiltStreakCheck";
import { patchVersionPoller } from "@/inngest/functions/patchVersionPoller";
import { achievementChecker } from "@/inngest/functions/achievementChecker";
import { timelineFetcher } from "@/inngest/functions/timelineFetcher";
import { dailyChallengeGenerator, weeklyChallengeGenerator } from "@/inngest/functions/challengeGenerator";
import { challengeProgressChecker } from "@/inngest/functions/challengeProgressChecker";
import { sendReengagementEmails } from "@/inngest/functions/sendReengagementEmails";
import { sendActivationEmail } from "@/inngest/functions/sendActivationEmail";
import { sendReportReadyEmail } from "@/inngest/functions/sendReportReadyEmail";
import { teamInviteEmail } from "@/inngest/functions/teamInviteEmail";
import { teamSubscriptionCancelledNotification, teamSubscriptionExpiredNotification } from "@/inngest/functions/teamSubscriptionNotification";
import { gdprErasure } from "@/inngest/functions/gdprErasure";
import { performanceSnapshotWorker } from "@/inngest/functions/performanceSnapshotWorker";
import { planExpiryChecker, planRenewalWorker } from "@/inngest/functions/planRenewal";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runCoachingJob, matchSyncWorker, autoSessionReview, sendRankChangeEmail, sendWeeklyReportEmails, tiltStreakCheck, patchVersionPoller, achievementChecker, timelineFetcher, dailyChallengeGenerator, weeklyChallengeGenerator, challengeProgressChecker, sendReengagementEmails, sendActivationEmail, sendReportReadyEmail, teamInviteEmail, teamSubscriptionCancelledNotification, teamSubscriptionExpiredNotification, gdprErasure, performanceSnapshotWorker, planExpiryChecker, planRenewalWorker],
});
