import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runAsBackground } from "@/lib/riot/priority";
import { runCoachingJob } from "@/inngest/functions/runCoachingJob";
import { matchSyncWorker } from "@/inngest/functions/matchSync";
import { autoSessionReview } from "@/inngest/functions/autoSessionReview";
import { sendRankChangeEmail } from "@/inngest/functions/sendRankChangeEmail";
import { sendWeeklyReportEmails } from "@/inngest/functions/sendWeeklyReportEmails";
import { tiltStreakCheck } from "@/inngest/functions/tiltStreakCheck";
import { patchVersionPoller } from "@/inngest/functions/patchVersionPoller";
import { warmEsportsCache } from "@/inngest/functions/warmEsportsCache";
import { achievementChecker } from "@/inngest/functions/achievementChecker";
import { timelineFetcher } from "@/inngest/functions/timelineFetcher";
import { rankEnricher } from "@/inngest/functions/rankEnricher";
import {
  dailyChallengeGenerator,
  weeklyChallengeGenerator,
} from "@/inngest/functions/challengeGenerator";
import { challengeProgressChecker } from "@/inngest/functions/challengeProgressChecker";
import { sendReengagementEmails } from "@/inngest/functions/sendReengagementEmails";
import { sendActivationEmail } from "@/inngest/functions/sendActivationEmail";
import { sendReportReadyEmail } from "@/inngest/functions/sendReportReadyEmail";
import { teamInviteEmail } from "@/inngest/functions/teamInviteEmail";
import {
  teamSubscriptionCancelledNotification,
  teamSubscriptionExpiredNotification,
} from "@/inngest/functions/teamSubscriptionNotification";
import { gdprErasure } from "@/inngest/functions/gdprErasure";
import { gdprExport } from "@/inngest/functions/gdprExport";
import { performanceSnapshotWorker } from "@/inngest/functions/performanceSnapshotWorker";
import { planExpiryChecker, planRenewalWorker } from "@/inngest/functions/planRenewal";
import { referralReward } from "@/inngest/functions/referralReward";
import { teamWeeklyReport } from "@/inngest/functions/teamWeeklyReport";
import { cartAbandonmentReminder } from "@/inngest/functions/cartAbandonment";
import { rtbfComplianceChecker } from "@/inngest/functions/rtbfComplianceChecker";
import { academyAssignmentChecker } from "@/inngest/functions/academyAssignmentChecker";
import { academyDecayChecker } from "@/inngest/functions/academyDecayChecker";
import { discordInteractionWorker } from "@/inngest/functions/discordInteraction";
import { marketplaceSchedules } from "@/inngest/marketplaceSchedules";

const handlers = serve({
  client: inngest,
  functions: [
    runCoachingJob,
    matchSyncWorker,
    autoSessionReview,
    sendRankChangeEmail,
    sendWeeklyReportEmails,
    tiltStreakCheck,
    patchVersionPoller,
    achievementChecker,
    timelineFetcher,
    rankEnricher,
    dailyChallengeGenerator,
    weeklyChallengeGenerator,
    challengeProgressChecker,
    sendReengagementEmails,
    sendActivationEmail,
    sendReportReadyEmail,
    teamInviteEmail,
    teamSubscriptionCancelledNotification,
    teamSubscriptionExpiredNotification,
    gdprErasure,
    gdprExport,
    performanceSnapshotWorker,
    planExpiryChecker,
    planRenewalWorker,
    referralReward,
    teamWeeklyReport,
    cartAbandonmentReminder,
    rtbfComplianceChecker,
    warmEsportsCache,
    ...marketplaceSchedules(),
    academyAssignmentChecker,
    academyDecayChecker,
    discordInteractionWorker,
  ],
});

// Everything Inngest runs is background work: it counts against at most half of the Riot budget,
// so a sweep or a queue of syncs can never leave a visitor's profile lookup without room (ADR-062).
type Handler = (typeof handlers)["POST"];
function background(handler: Handler): Handler {
  return ((...args: Parameters<Handler>) => runAsBackground(() => handler(...args))) as Handler;
}

export const GET = background(handlers.GET);
export const POST = background(handlers.POST);
export const PUT = background(handlers.PUT);
