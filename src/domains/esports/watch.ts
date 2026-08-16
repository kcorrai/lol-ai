import type { EventStream, GameVod } from "@/domains/esports/types";

/**
 * Where to watch something, resolved to a URL a reader can click.
 *
 * The feed hands out a provider and a bare parameter — a Twitch channel name or
 * a YouTube id — and leaves the URL to the caller. Building it in one place is
 * what stops a second caller guessing the shape and getting it subtly wrong.
 */
export interface WatchLink {
  url: string;
  provider: "twitch" | "youtube";
  /** Feed locale, e.g. "en-US". The key, not the label. */
  locale: string;
  /** The language as the feed writes it for a reader: "Türkçe", "English". */
  language: string;
}

const PROVIDERS = ["twitch", "youtube"] as const;

function isProvider(raw: string): raw is (typeof PROVIDERS)[number] {
  return (PROVIDERS as readonly string[]).includes(raw);
}

/**
 * English first, then everything else by language name.
 *
 * There is no viewer locale to sort by — these pages are server-rendered and
 * cached, so the order has to be the same for everyone. English is the one
 * broadcast most likely to be understood by a reader who arrived at an
 * English-language site, and the rest are alphabetical rather than in the
 * feed's own order, which is not stable.
 */
function byLanguage(a: WatchLink, b: WatchLink): number {
  const aEnglish = a.locale.startsWith("en");
  const bEnglish = b.locale.startsWith("en");
  if (aEnglish !== bEnglish) return aEnglish ? -1 : 1;
  return a.language.localeCompare(b.language);
}

/** One link per language per provider; the feed repeats a broadcast across locales. */
function dedupe(links: WatchLink[]): WatchLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.provider}:${link.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * A VOD link, opened at the game rather than at the start of the broadcast.
 *
 * `startMillis` is the offset of this game inside a series VOD, which is the
 * difference between "here is a six-hour stream" and "here is game 3". It is
 * null on some locales' copies, and then the link is simply the video.
 */
export function vodLink(vod: GameVod): WatchLink | null {
  if (!isProvider(vod.provider) || !vod.parameter) return null;

  if (vod.provider === "youtube") {
    const seconds = vod.startMillis !== null ? Math.floor(vod.startMillis / 1000) : 0;
    const url =
      seconds > 0
        ? `https://www.youtube.com/watch?v=${vod.parameter}&t=${seconds}s`
        : `https://www.youtube.com/watch?v=${vod.parameter}`;
    return { url, provider: "youtube", locale: vod.locale, language: vod.language };
  }

  return {
    url: `https://www.twitch.tv/videos/${vod.parameter}`,
    provider: "twitch",
    locale: vod.locale,
    language: vod.language,
  };
}

/** A live broadcast link. Twitch parameters are channel names, YouTube's are video ids. */
export function streamLink(stream: EventStream): WatchLink | null {
  if (!isProvider(stream.provider) || !stream.parameter) return null;

  return {
    url:
      stream.provider === "twitch"
        ? `https://www.twitch.tv/${stream.parameter}`
        : `https://www.youtube.com/watch?v=${stream.parameter}`,
    provider: stream.provider,
    locale: stream.locale,
    language: stream.language,
  };
}

export function vodLinks(vods: GameVod[]): WatchLink[] {
  return dedupe(vods.map(vodLink).filter((link): link is WatchLink => link !== null)).sort(
    byLanguage
  );
}

export function streamLinks(streams: EventStream[]): WatchLink[] {
  return dedupe(streams.map(streamLink).filter((link): link is WatchLink => link !== null)).sort(
    byLanguage
  );
}
