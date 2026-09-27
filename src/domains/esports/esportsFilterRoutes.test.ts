import { describe, expect, it } from "vitest";
import { esportsFilterRoute } from "./esportsFilterRoutes";

const route = (path: string, query = "") => esportsFilterRoute(path, new URLSearchParams(query));

describe("esportsFilterRoute", () => {
  it("rewrites a game of a series onto its cacheable path", () => {
    expect(route("/esports/matches/115548668059523724", "g=3")).toEqual({
      kind: "rewrite",
      pathname: "/esports/matches/115548668059523724/f/3",
    });
  });

  it("leaves a series without a game, or with a game no series has, to the static page", () => {
    expect(route("/esports/matches/1")).toBeNull();
    expect(route("/esports/matches/1", "g=6")).toBeNull();
    expect(route("/esports/matches/1", "g=1'")).toBeNull();
  });

  it("rewrites the pro champion filters, dropping the default sort", () => {
    expect(route("/esports/champions", "league=lck&sort=winRate&role=mid")).toEqual({
      kind: "rewrite",
      pathname: "/esports/champions/f/lck/winRate/mid",
    });
    expect(route("/esports/champions", "role=support&sort=picks")).toEqual({
      kind: "rewrite",
      pathname: "/esports/champions/f/any/any/support",
    });
    expect(route("/esports/champions", "sort=picks")).toBeNull();
  });

  it("ignores a league that is not shaped like one", () => {
    expect(route("/esports/champions", "league=<script>")).toBeNull();
    expect(route("/esports/champions", `league=${"a".repeat(41)}`)).toBeNull();
  });

  it("rewrites the VOD archive, encoding a league name and rounding the length to whole pages", () => {
    expect(route("/esports/vods", "league=LCK Challengers League&show=41")).toEqual({
      kind: "rewrite",
      pathname: "/esports/vods/f/LCK%20Challengers%20League/80",
    });
  });

  it("treats a first-page or absurd length as no length at all", () => {
    expect(route("/esports/vods", "show=40")).toBeNull();
    expect(route("/esports/vods", "show=99999")).toBeNull();
    expect(route("/esports/vods", "show=abc")).toBeNull();
  });

  it("refuses the internal paths when asked for them directly", () => {
    expect(route("/esports/matches/1/f/2")).toEqual({ kind: "not-found" });
    expect(route("/esports/champions/f/lck/any/any")).toEqual({ kind: "not-found" });
    expect(route("/esports/vods/f/any/80")).toEqual({ kind: "not-found" });
  });

  it("leaves the rest of the section alone", () => {
    expect(route("/esports/matches/1/opengraph-image-abc")).toBeNull();
    expect(route("/esports/schedule", "league=lck")).toBeNull();
  });
});
