import { logger } from "@/lib/utils/logger";
import { getLeagues, prominentLeagues, getCurrentTournament } from "@/domains/esports/services/leagueService";
import { getStandings } from "@/domains/esports/services/standingsService";
import { getLiveEvents, getUpcoming, getCompleted } from "@/domains/esports/services/scheduleService";
import { getProSample } from "@/domains/esports/services/proSampleService";
import { getTeams } from "@/domains/esports/services/teamService";

/**
 * A unit of warming, with what it is expected to cost.
 *
 * The cost is declared rather than measured, and that is the point: it is a
 * budget the run is held to, so a task whose real cost grows silently gets cut
 * off by the cap instead of quietly walking the whole feed.
 */
export interface WarmTask {
  name: string;
  /** Approximate feed requests. */
  cost: number;
  run: () => Promise<void>;
}

export interface WarmReport {
  warmed: string[];
  /** Tasks the budget did not reach, in the order they would have run. */
  skipped: string[];
  /** Tasks that threw. The cache keeps its last good copy for these. */
  failed: string[];
  spent: number;
  budget: number;
}

/** How many leagues get their standings refreshed. The same bar the rest of the section uses. */
const STANDINGS_LEAGUES = 6;

/**
 * The warm list, most valuable first.
 *
 * Order is the whole design. The budget runs out somewhere down this list, and
 * what survives has to be what a reader would otherwise wait for:
 *
 * 1. **Live and the schedule window** — cheapest and most time-sensitive; every
 *    page in the section reads one of them.
 * 2. **The pro sample** — by far the most expensive thing in the section
 *    (roughly 150 feed reads) and the one that gates a visible feature: the
 *    `ProPlayStrip` on build and champion pages reads cache-only, so while this
 *    is cold the strip renders nowhere at all.
 * 3. **Standings** for the leagues people actually watch.
 * 4. **Teams and rosters** — a day-long TTL, so this is a backstop rather than a
 *    refresh.
 */
export function warmTasks(): WarmTask[] {
  return [
    {
      name: "live",
      cost: 1,
      run: async () => {
        await getLiveEvents(true);
      },
    },
    {
      name: "schedule",
      cost: 3,
      run: async () => {
        await getUpcoming({ limit: 120, force: true });
        await getCompleted({ limit: 60, force: true });
      },
    },
    {
      name: "pro-sample",
      cost: 150,
      run: async () => {
        await getProSample({ force: true });
      },
    },
    {
      name: "standings",
      cost: 12,
      run: async () => {
        const leagues = prominentLeagues(await getLeagues(), STANDINGS_LEAGUES);
        for (const league of leagues) {
          const tournament = await getCurrentTournament(league.id);
          if (tournament) await getStandings(tournament.id, true);
        }
      },
    },
    {
      name: "teams",
      cost: 1,
      run: async () => {
        await getTeams();
      },
    },
  ];
}

/**
 * Refresh the section's caches before a reader has to.
 *
 * Every task runs through the same domain services the pages use — there is no
 * second code path and nothing bypasses the Zod boundary, so a warm run cannot
 * write a shape a page would not accept.
 *
 * Failures are contained per task. A task that throws leaves its own last-good
 * snapshot untouched (that is `cachedResource`'s contract) and does not stop the
 * tasks after it, because the pro sample failing is no reason to leave the
 * schedule cold.
 */
export async function warmEsports({ budget }: { budget: number }): Promise<WarmReport> {
  const report: WarmReport = { warmed: [], skipped: [], failed: [], spent: 0, budget };

  for (const task of warmTasks()) {
    if (report.spent + task.cost > budget) {
      report.skipped.push(task.name);
      continue;
    }

    // Counted before the attempt: a task that fails half way still spent the
    // requests it made, and a budget that only counts successes is not a cap.
    report.spent += task.cost;

    try {
      await task.run();
      report.warmed.push(task.name);
    } catch (err) {
      report.failed.push(task.name);
      logger.warn(`[esports/warm] ${task.name} failed`, err);
    }
  }

  logger.info("[esports/warm] run complete", {
    warmed: report.warmed,
    skipped: report.skipped,
    failed: report.failed,
    spent: report.spent,
    budget: report.budget,
  });

  return report;
}
