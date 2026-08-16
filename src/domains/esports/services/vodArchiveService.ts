import { z } from "zod";
import {
  cachedResource,
  esportsFetch,
  httpsAsset,
  TTL,
} from "@/domains/esports/services/esportsApi";
import type { ArchivedGame, VodSeries } from "@/domains/esports/types";

const CACHE_TYPE = "esports-vods";

/**
 * `getVods` — the one endpoint in the feed built around watching rather than
 * results, and the one this section had never called.
 *
 * It answers with the last few hundred completed series across every league in
 * a single request, each with its games and the video ids they were recorded
 * on. Probed live: 300 series over 18 days, 25 leagues, 798 games of which 653
 * have a recording.
 *
 * What it does *not* carry, and the per-match feed does, is a provider or a
 * locale for each video. That is why `inferVodProvider` exists and why the
 * archive links a game to our own match page rather than guessing an off-site
 * URL — see the comment there.
 */

const VodSchema = z.object({
  parameter: z.string().nullish(),
  startMillis: z.number().nullish(),
  endMillis: z.number().nullish(),
});

const EventSchema = z.object({
  startTime: z.string(),
  state: z.string().nullish(),
  blockName: z.string().nullish(),
  league: z.object({ name: z.string() }),
  match: z.object({
    id: z.string(),
    strategy: z.object({ count: z.number().nullish() }).nullish(),
    teams: z.array(
      z.object({
        name: z.string(),
        code: z.string(),
        image: z.string().nullish(),
        result: z.object({ gameWins: z.number().nullish() }).nullish(),
      })
    ),
  }),
  games: z
    .array(
      z.object({
        id: z.string(),
        state: z.string().nullish(),
        vods: z.array(VodSchema).nullish(),
      })
    )
    .nullish(),
});

const VodsSchema = z.object({
  data: z.object({ schedule: z.object({ events: z.array(EventSchema) }) }),
});

type RawEvent = z.infer<typeof EventSchema>;

function mapGames(event: RawEvent): ArchivedGame[] {
  return (event.games ?? []).flatMap((game, index) => {
    const vods = (game.vods ?? []).filter((vod) => Boolean(vod.parameter));
    if (vods.length === 0) return [];

    // The feed repeats one video across locales; the ids are what differ, and a
    // reader wants each distinct recording once.
    const videoIds = [...new Set(vods.map((vod) => vod.parameter as string))];

    const withOffset = vods.find((vod) => vod.startMillis != null);
    const startMillis = withOffset?.startMillis ?? null;
    const endMillis = withOffset?.endMillis ?? null;

    return [
      {
        id: game.id,
        // The feed omits the game number here, unlike every other endpoint. The
        // array order is the play order, so position is the only source for it.
        number: index + 1,
        videoIds,
        startMillis,
        segmentSeconds:
          startMillis !== null && endMillis != null && endMillis > startMillis
            ? Math.round((endMillis - startMillis) / 1000)
            : null,
      },
    ];
  });
}

function mapSeries(event: RawEvent): VodSeries | null {
  const games = mapGames(event);
  // A series with nothing recorded is a schedule row, not an archive entry.
  if (games.length === 0) return null;

  return {
    matchId: event.match.id,
    startTime: event.startTime,
    leagueName: event.league.name,
    blockName: event.blockName ?? null,
    bestOf: event.match.strategy?.count ?? null,
    teams: event.match.teams.map((team) => ({
      name: team.name,
      code: team.code,
      image: httpsAsset(team.image),
      gameWins: team.result?.gameWins ?? 0,
    })),
    games,
  };
}

/**
 * Every recently recorded series, most recent first.
 *
 * One feed request for the whole archive, cached on the schedule's window —
 * a series joins it once its VOD is published, which happens within hours of
 * the games rather than on the schedule's own clock, so a shorter TTL would buy
 * nothing and a longer one would hide new recordings for a day.
 */
export async function getVodArchive(options: { force?: boolean } = {}): Promise<VodSeries[]> {
  const series = await cachedResource({
    key: "vods",
    type: CACHE_TYPE,
    ttlDays: TTL.schedule,
    force: options.force,
    schema: VodsSchema,
    fetcher: () => esportsFetch("getVods"),
    map: (raw) =>
      raw.data.schedule.events
        .map(mapSeries)
        .filter((entry): entry is VodSeries => entry !== null)
        .sort((a, b) => b.startTime.localeCompare(a.startTime)),
  });

  return series ?? [];
}

/** League names present in the archive, most-recorded first. */
export function archiveLeagues(series: VodSeries[]): { name: string; series: number }[] {
  const counts = new Map<string, number>();
  for (const entry of series) {
    counts.set(entry.leagueName, (counts.get(entry.leagueName) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, series: count }))
    .sort((a, b) => b.series - a.series || a.name.localeCompare(b.name));
}
