import type { EventStream, GameVod } from "@/domains/esports/types";
import { orderWatchLinks, streamLink, vodLink, type WatchLink } from "@/domains/esports/watch";

// How a broadcast becomes something that plays on our page rather than on
// someone else's. Split from watch.ts, which answers the different question of
// where to send a reader who clicks out — the two are not the same address.

/**
 * The host Twitch is told to expect the player to be embedded on.
 *
 * Twitch refuses to play in an iframe whose `parent` does not match the page's
 * own domain — an anti-hotlinking measure, and the reason an embed that works
 * locally can be a black box in production. Derived from the app URL rather
 * than hardcoded so a preview deployment and localhost each name themselves.
 */
export function embedParent(appUrl: string | undefined): string | null {
  if (!appUrl) return null;
  try {
    return new URL(appUrl).hostname;
  } catch {
    return null;
  }
}

/** Twitch takes an offset as `1h2m3s`, not as a number of seconds. */
function twitchTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h${m}m${s}s`;
}

interface EmbedSource {
  provider: string;
  parameter: string;
  startMillis?: number | null;
  /** A live broadcast is addressed by channel, a recording by video id. */
  live?: boolean;
}

/**
 * A broadcast as a URL that can go in an iframe.
 *
 * Separate from `WatchLink.url` because the two are genuinely different
 * addresses: a Twitch VOD is watched at `/videos/{id}` and embedded at
 * `player.twitch.tv/?video=v{id}`, and YouTube's embed path is not its watch
 * path either. A caller that guessed would render an iframe around a 404.
 *
 * YouTube goes through `youtube-nocookie.com`, which holds off on the tracking
 * cookie until playback actually starts.
 *
 * Null when the embed cannot be built — no parent for Twitch, or a provider we
 * host no player for. The caller then falls back to the link it already had: an
 * embed is an upgrade on a link, never a replacement for one.
 */
export function embedUrl(source: EmbedSource, parent: string | null): string | null {
  const seconds = source.startMillis ? Math.floor(source.startMillis / 1000) : 0;

  if (source.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.parameter)}${
      seconds > 0 ? `?start=${seconds}` : ""
    }`;
  }

  if (source.provider !== "twitch" || !parent) return null;

  // The feed publishes a video id without the leading "v" the player wants.
  const target = source.live
    ? `channel=${encodeURIComponent(source.parameter)}`
    : `video=v${encodeURIComponent(source.parameter)}`;

  return `https://player.twitch.tv/?${target}&parent=${encodeURIComponent(parent)}${
    seconds > 0 ? `&time=${twitchTime(seconds)}` : ""
  }`;
}

/** The one broadcast worth mounting a player for, and its embed URL. */
export interface PrimaryEmbed {
  src: string;
  link: WatchLink;
}

function primary<T extends { provider: string; parameter: string }>(
  sources: T[],
  toLink: (source: T) => WatchLink | null,
  parent: string | null,
  extra: (source: T) => Partial<EmbedSource>
): PrimaryEmbed | null {
  // Ordered by the same rule the chips use, so the player that mounts is the
  // one at the head of the list rather than an arbitrary other broadcast.
  const candidates = sources
    .map((source) => ({ source, link: toLink(source) }))
    .filter((entry): entry is { source: T; link: WatchLink } => entry.link !== null)
    .sort((a, b) => orderWatchLinks(a.link, b.link));

  for (const { source, link } of candidates) {
    const src = embedUrl({ ...source, ...extra(source) }, parent);
    if (src) return { src, link };
  }
  return null;
}

/** The VOD to play in-page for one game, deep-linked to where that game starts. */
export function primaryVodEmbed(vods: GameVod[], parent: string | null): PrimaryEmbed | null {
  return primary(vods, vodLink, parent, (vod) => ({ startMillis: vod.startMillis }));
}

/** The live broadcast to play in-page for a match that is on right now. */
export function primaryStreamEmbed(
  streams: EventStream[],
  parent: string | null
): PrimaryEmbed | null {
  return primary(streams, streamLink, parent, () => ({ live: true }));
}
