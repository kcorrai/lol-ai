import { describe, it, expect } from "vitest";
import { embedParent, embedUrl, primaryStreamEmbed, primaryVodEmbed } from "./watchEmbed";
import type { EventStream, GameVod } from "./types";

const vod = (over: Partial<GameVod> = {}): GameVod =>
  ({
    provider: "youtube",
    parameter: "dQw4w9WgXcQ",
    locale: "en-US",
    language: "English",
    startMillis: null,
    ...over,
  }) as GameVod;

const stream = (over: Partial<EventStream> = {}): EventStream =>
  ({
    provider: "twitch",
    parameter: "lec",
    locale: "en-US",
    language: "English",
    ...over,
  }) as EventStream;

describe("embedParent", () => {
  it("takes the host out of the app URL", () => {
    expect(embedParent("https://lolaicoach.gg")).toBe("lolaicoach.gg");
    expect(embedParent("http://localhost:3000")).toBe("localhost");
  });

  it("is null when there is no usable URL, rather than guessing one", () => {
    // A wrong `parent` is worse than none: Twitch answers with a black box
    // instead of an error, so the caller has to be able to fall back to a link.
    expect(embedParent(undefined)).toBeNull();
    expect(embedParent("not a url")).toBeNull();
  });
});

describe("embedUrl", () => {
  it("sends YouTube through the no-cookie host", () => {
    // Which is what lets the player load without writing a tracking cookie for
    // a reader who has not started the video.
    expect(embedUrl({ provider: "youtube", parameter: "abc" }, "lolaicoach.gg")).toBe(
      "https://www.youtube-nocookie.com/embed/abc"
    );
  });

  it("deep-links YouTube in seconds and Twitch in h/m/s", () => {
    // The two providers genuinely disagree about the format, which is the kind
    // of thing a second caller would get wrong.
    expect(
      embedUrl({ provider: "youtube", parameter: "abc", startMillis: 3_723_000 }, "x.gg")
    ).toBe("https://www.youtube-nocookie.com/embed/abc?start=3723");

    expect(
      embedUrl({ provider: "twitch", parameter: "12345", startMillis: 3_723_000 }, "x.gg")
    ).toBe("https://player.twitch.tv/?video=v12345&parent=x.gg&time=1h2m3s");
  });

  it("addresses a live Twitch broadcast by channel and a recording by video id", () => {
    expect(embedUrl({ provider: "twitch", parameter: "lec", live: true }, "x.gg")).toBe(
      "https://player.twitch.tv/?channel=lec&parent=x.gg"
    );
    // The feed publishes the id without the leading "v" the player wants.
    expect(embedUrl({ provider: "twitch", parameter: "9988", live: false }, "x.gg")).toBe(
      "https://player.twitch.tv/?video=v9988&parent=x.gg"
    );
  });

  it("refuses a Twitch embed with no parent to name", () => {
    expect(embedUrl({ provider: "twitch", parameter: "lec", live: true }, null)).toBeNull();
    // YouTube does not care, so it still works.
    expect(embedUrl({ provider: "youtube", parameter: "abc" }, null)).not.toBeNull();
  });

  it("refuses a provider we host no player for", () => {
    expect(embedUrl({ provider: "afreecatv", parameter: "123" }, "x.gg")).toBeNull();
  });
});

describe("primaryVodEmbed", () => {
  it("picks the English broadcast, matching the order of the chips beside it", () => {
    const result = primaryVodEmbed(
      [
        vod({ parameter: "tr-video", locale: "tr-TR", language: "Türkçe" }),
        vod({ parameter: "en-video", locale: "en-US", language: "English" }),
      ],
      "x.gg"
    );

    expect(result?.src).toContain("en-video");
    expect(result?.link.language).toBe("English");
  });

  it("falls through to a broadcast it can embed when the first one it cannot", () => {
    // A Twitch VOD with no parent cannot be embedded, but the YouTube copy of
    // the same game can — and a player is better than none.
    const result = primaryVodEmbed(
      [
        vod({ provider: "twitch", parameter: "9988", locale: "en-US", language: "English" }),
        vod({ provider: "youtube", parameter: "abc", locale: "ko-KR", language: "한국어" }),
      ],
      null
    );

    expect(result?.src).toBe("https://www.youtube-nocookie.com/embed/abc");
  });

  it("is null when nothing can be embedded, so the caller keeps its links", () => {
    expect(primaryVodEmbed([vod({ provider: "twitch", parameter: "1" })], null)).toBeNull();
    expect(primaryVodEmbed([], "x.gg")).toBeNull();
  });

  it("carries the game's offset into the player", () => {
    const result = primaryVodEmbed([vod({ startMillis: 2_328_000 })], "x.gg");
    expect(result?.src).toContain("start=2328");
  });
});

describe("primaryStreamEmbed", () => {
  it("embeds a live Twitch broadcast by channel", () => {
    const result = primaryStreamEmbed([stream()], "x.gg");
    expect(result?.src).toBe("https://player.twitch.tv/?channel=lec&parent=x.gg");
  });

  it("is null with nothing live", () => {
    expect(primaryStreamEmbed([], "x.gg")).toBeNull();
  });
});
