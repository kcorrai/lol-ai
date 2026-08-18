import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { getCardByToken } from "@/domains/coaching/services/cardService";
import type { WeeklyCardData, MasteryCardData, AcademyCardData } from "@/domains/coaching/services/cardService";
import { W, H } from "./cardOgTokens";
import { WeeklyCard } from "./weeklyCardOg";
import { MasteryCard } from "./masteryCardOg";
import { AcademyCard } from "./academyCardOg";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  let result: Awaited<ReturnType<typeof getCardByToken>>;

  try {
    result = await getCardByToken(params.token);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return new Response(null, { status: 404 });
    return new Response(null, { status: 500 });
  }

  if (result.expired) return new Response(null, { status: 410 });

  const { data } = result;
  const element =
    data.cardType === "academy" ? (
      <AcademyCard d={data as AcademyCardData} />
    ) : data.cardType === "mastery" ? (
      <MasteryCard d={data as MasteryCardData} />
    ) : (
      <WeeklyCard d={data as WeeklyCardData} />
    );

  return new ImageResponse(element, {
    width: W,
    height: H,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
