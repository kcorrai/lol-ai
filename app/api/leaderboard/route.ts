import { type NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { getLeaderboard } from "@/domains/analysis/services/leaderboardService";

export const revalidate = 300; // 5 min cache

export async function GET(req: NextRequest): Promise<Response> {
  const period = (req.nextUrl.searchParams.get("period") ?? "week") as "week" | "month";
  const data = await getLeaderboard(period);
  return apiSuccess(data);
}
