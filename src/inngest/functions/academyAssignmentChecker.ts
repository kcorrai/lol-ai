import { inngest } from "@/inngest/client";
import { checkAssignments } from "@/domains/academy";
import { logger } from "@/lib/utils/logger";

// Fired after every match sync (LA-22). This is the half of the Academy that makes it more
// than a course: a lesson's field assignment is judged against the player's real ranked games,
// and passing it is the only thing in the product that marks a lesson `mastered`.
export const academyAssignmentChecker = inngest.createFunction(
  {
    id: "academy-assignment-checker",
    triggers: [{ event: "academy/check-assignments" }],
    retries: 2,
  },
  async ({ event }: { event: { data: { userId: string; riotAccountId: string } } }) => {
    const { userId, riotAccountId } = event.data;

    const result = await checkAssignments(userId, riotAccountId);

    if (result.passed.length > 0) {
      logger.info(
        `[academyAssignments] user ${userId} mastered ${result.passed.length} lesson(s): ${result.passed.join(", ")}`
      );
    }

    return result;
  }
);
