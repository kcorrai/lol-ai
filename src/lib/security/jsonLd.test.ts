import { describe, it, expect } from "vitest";
import { jsonLdHtml, jsonLdProps } from "@/lib/security/jsonLd";

describe("jsonLdHtml", () => {
  it("cannot be closed out of a script tag", () => {
    const html = jsonLdHtml({ name: "</script><script>alert(1)</script>" });
    expect(html).not.toContain("</script>");
    expect(html).not.toContain("<");
    expect(html).not.toContain(">");
  });

  it("keeps the value intact for a JSON parser", () => {
    const payload = { name: "a<b>c&d", nested: { list: ["x</script>"] } };
    expect(JSON.parse(jsonLdHtml(payload))).toEqual(payload);
  });

  it("escapes the line separators that break a JavaScript source text", () => {
    const html = jsonLdHtml({ name: "a\u2028b\u2029c" });
    expect(html).toContain("\\u2028");
    expect(html).toContain("\\u2029");
  });

  it("exposes the same string as a dangerouslySetInnerHTML prop", () => {
    const payload = { "@type": "Person", name: "Faker#KR1" };
    expect(jsonLdProps(payload)).toEqual({ __html: jsonLdHtml(payload) });
  });
});
