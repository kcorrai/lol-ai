import { describe, expect, it } from "vitest";
import { youtubeEmbedUrl, youtubeVideoId } from "@/domains/marketplace/youtube";

describe("youtubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ"],
    ["  https://youtu.be/dQw4w9WgXcQ?si=abc  "],
  ])("reads the id from %s", (link) => {
    expect(youtubeVideoId(link)).toBe("dQw4w9WgXcQ");
  });

  it.each([
    ["not a url"],
    ["https://vimeo.com/123456"],
    ["https://www.youtube.com/@somechannel"],
    ["https://www.youtube.com/playlist?list=PL123"],
    ["https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ"],
    ["javascript:alert(1)"],
    ["https://youtu.be/short"],
  ])("refuses %s", (link) => {
    expect(youtubeVideoId(link)).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("uses the cookie-less host", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
  });
});
