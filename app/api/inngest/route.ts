import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runCoachingJob } from "@/inngest/functions/runCoachingJob";
import { autoSessionReview } from "@/inngest/functions/autoSessionReview";
import { sendRankChangeEmail } from "@/inngest/functions/sendRankChangeEmail";
import { sendWeeklyReportEmails } from "@/inngest/functions/sendWeeklyReportEmails";
import { tiltStreakCheck } from "@/inngest/functions/tiltStreakCheck";
import { patchVersionPoller } from "@/inngest/functions/patchVersionPoller";
import { achievementChecker } from "@/inngest/functions/achievementChecker";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runCoachingJob, autoSessionReview, sendRankChangeEmail, sendWeeklyReportEmails, tiltStreakCheck, patchVersionPoller, achievementChecker],
});
