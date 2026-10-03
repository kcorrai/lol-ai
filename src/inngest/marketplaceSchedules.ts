import { marketplaceSweeps } from "@/inngest/functions/marketplaceSweeps";
import { refreshCoachRanks } from "@/inngest/functions/refreshCoachRanks";

type MarketplaceSchedule = typeof marketplaceSweeps | typeof refreshCoachRanks;

/**
 * The marketplace's scheduled jobs, served only once the marketplace is live.
 *
 * The five-minute booking sweep kept Neon's compute awake around the clock:
 * the database suspends after five idle minutes, so a query every five
 * minutes meant it never did — about 6 CU-hours a day on a free plan, for a
 * sweep that found the marketplace tables missing in production on every run
 * (LA-137, ADR-064). A function left out of `serve()` is unscheduled by
 * Inngest on the next sync, so nothing is invoked at all while this is off.
 */
export function marketplaceSchedules(
  env: Readonly<Record<string, string | undefined>> = process.env
): MarketplaceSchedule[] {
  return env.MARKETPLACE_ENABLED === "true" ? [marketplaceSweeps, refreshCoachRanks] : [];
}
