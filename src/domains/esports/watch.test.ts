import { describe, it, expect } from "vitest";
import { archiveLink, inferVodProvider, streamLink, streamLinks, vodLink, vodLinks } from "./watch";
import type { EventStream, GameVod } from "./types";

function vod(over: Partial<GameVod> = {}): GameVod {
  return {
    provider: "youtube",
    parameter: "adBJ3Auz7VQ",
    locale: "en-US",
    language: "English (North America)",
    startMillis: null,
    ...over,
  };
}

function stream(over: Partial<EventStream> = {}): EventStream {
  return {
    provider: "twitch",
    parameter: "lolpacificen",
    locale: "en-SG",
    language: "English (Singapore)",
    ...over,
  };
}

describe("vodLink", () => {
  it("opens the video at the game rather than at the start of the broadcast", () => {
    // 2325 seconds in is game 3 of a series, not minute zero of a six-hour stream.
    expect(vodLink(vod({ startMillis: 2_325_000 }))?.url).toBe(
      "https://www.youtube.com/watch?v=adBJ3Auz7VQ&t=2325s"
    );
  });

  it("links the plain video when this locale's copy carries no offset", () => {
    expect(vodLink(vod({ startMillis: null }))?.url).toBe(
      "https://www.youtube.com/watch?v=adBJ3Auz7VQ"
    );
    // Zero is an offset of zero, which is the same link as none.
    expect(vodLink(vod({ startMillis: 0 }))?.url).toBe(
      "https://www.youtube.com/watch?v=adBJ3Auz7VQ"
    );
  });

  it("builds a Twitch VOD URL, which is not the channel URL", () => {
    expect(vodLink(vod({ provider: "twitch", parameter: "123456" }))?.url).toBe(
      "https://www.twitch.tv/videos/123456"
    );
  });

  it("refuses a provider it cannot build a URL for", () => {
    expect(vodLink(vod({ provider: "afreecatv" }))).toBeNull();
    expect(vodLink(vod({ parameter: "" }))).toBeNull();
  });
});

describe("streamLink", () => {
  it("treats a Twitch parameter as a channel and a YouTube one as a video", () => {
    expect(streamLink(stream())?.url).toBe("https://www.twitch.tv/lolpacificen");
    expect(streamLink(stream({ provider: "youtube", parameter: "lfBFfzDwCkA" }))?.url).toBe(
      "https://www.youtube.com/watch?v=lfBFfzDwCkA"
    );
  });

  it("drops a provider it does not know", () => {
    expect(streamLink(stream({ provider: "huya" }))).toBeNull();
  });
});

describe("ordering and duplicates", () => {
  it("puts English first and orders the rest by language name", () => {
    const links = streamLinks([
      stream({ parameter: "tw", locale: "zh-TW", language: "繁體中文" }),
      stream({ parameter: "tr", locale: "tr-TR", language: "Türkçe" }),
      stream({ parameter: "en", locale: "en-US", language: "English" }),
    ]);

    expect(links.map((link) => link.locale)).toEqual(["en-US", "tr-TR", "zh-TW"]);
  });

  it("keeps one entry per broadcast when the feed repeats it across locales", () => {
    const links = streamLinks([
      stream({ parameter: "same", locale: "en-US", language: "English" }),
      stream({ parameter: "same", locale: "en-GB", language: "English (UK)" }),
    ]);

    expect(links).toHaveLength(1);
  });

  it("drops unbuildable entries instead of rendering a dead link", () => {
    const links = vodLinks([vod(), vod({ provider: "afreecatv", parameter: "x" })]);

    expect(links).toHaveLength(1);
    expect(links[0].provider).toBe("youtube");
  });

  it("returns nothing when there is nothing to watch", () => {
    expect(vodLinks([])).toEqual([]);
    expect(streamLinks([])).toEqual([]);
  });
});

describe("inferVodProvider", () => {
  it("recognises a YouTube id", () => {
    expect(inferVodProvider("adBJ3Auz7VQ")).toBe("youtube");
    expect(inferVodProvider("bQ2c75kKpHU")).toBe("youtube");
    // Underscores and hyphens are in YouTube's alphabet.
    expect(inferVodProvider("a_BJ3-uz7VQ")).toBe("youtube");
  });

  it("refuses to name a platform for an all-digit id", () => {
    // The trap this exists for. A numeric id looks like Twitch and often is
    // not: checking 174 archived VODs against the per-match feed that does
    // publish a provider, 16 were afreecatv, whose ids are numeric too.
    expect(inferVodProvider("2845212286")).toBeNull();
    expect(inferVodProvider("202892313")).toBeNull();
  });

  it("refuses anything that is not eleven characters", () => {
    expect(inferVodProvider("short")).toBeNull();
    expect(inferVodProvider("waytoolongtobeayoutubeid")).toBeNull();
    expect(inferVodProvider("")).toBeNull();
  });
});

describe("archiveLink", () => {
  it("opens a YouTube recording at the game rather than the broadcast", () => {
    expect(archiveLink("adBJ3Auz7VQ", 2328000)).toBe(
      "https://www.youtube.com/watch?v=adBJ3Auz7VQ&t=2328s"
    );
  });

  it("links the plain video when the feed publishes no offset", () => {
    expect(archiveLink("adBJ3Auz7VQ", null)).toBe("https://www.youtube.com/watch?v=adBJ3Auz7VQ");
  });

  it("has no link for an id whose platform cannot be named", () => {
    // Guessing twitch.tv/videos/202892313 here would be a dead link to a
    // recording that lives on afreecatv.
    expect(archiveLink("202892313", 0)).toBeNull();
  });
});
