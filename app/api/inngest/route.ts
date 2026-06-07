import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runCoachingJob } from "@/inngest/functions/runCoachingJob";
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

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runCoachingJob, autoSessionReview, sendRankChangeEmail, sendWeeklyReportEmails, tiltStreakCheck, patchVersionPoller, achievementChecker, timelineFetcher, dailyChallengeGenerator, weeklyChallengeGenerator, challengeProgressChecker, sendReengagementEmails, sendActivationEmail],
});
