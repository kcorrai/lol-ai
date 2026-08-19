import { describe, expect, it } from "vitest";
import { httpUrl, isSafeHttpUrl, safeHref } from "@/lib/security/url";

describe("httpUrl", () => {
  it("accepts the links people actually paste", () => {
    expect(httpUrl.safeParse("https://meet.google.com/abc-defg-hij").success).toBe(true);
    expect(httpUrl.safeParse("http://localhost:3001/room/1").success).toBe(true);
  });

  /**
   * The reason this schema exists. `z.string().url()` accepts both of these, and the
   * value goes into an `href` the other party clicks — a coach could hand a student a
   * script disguised as a meeting link.
   */
  it("rejects the schemes that execute in a browser", () => {
    expect(httpUrl.safeParse("javascript:alert(1)").success).toBe(false);
    expect(httpUrl.safeParse("data:text/html,<script>alert(1)</script>").success).toBe(false);
    expect(httpUrl.safeParse("vbscript:msgbox(1)").success).toBe(false);
  });

  it("rejects a URL with no host", () => {
    expect(httpUrl.safeParse("https:///").success).toBe(false);
    expect(httpUrl.safeParse("not a url").success).toBe(false);
  });

  it("is case-insensitive about the scheme", () => {
    expect(httpUrl.safeParse("JavaScript:alert(1)").success).toBe(false);
    expect(httpUrl.safeParse("HTTPS://example.com").success).toBe(true);
  });
});

describe("safeHref", () => {
  it("hands back only a link that is safe to follow", () => {
    expect(safeHref("https://example.com/vod")).toBe("https://example.com/vod");
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref(null)).toBeNull();
    expect(safeHref(undefined)).toBeNull();
    expect(safeHref("")).toBeNull();
  });

  it("agrees with isSafeHttpUrl", () => {
    expect(isSafeHttpUrl("https://example.com")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });
});
