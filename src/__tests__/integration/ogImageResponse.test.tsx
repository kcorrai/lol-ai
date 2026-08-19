import { describe, it, expect } from "vitest";
import { ImageResponse } from "next/og";

// LA-41: `next/og` dynamic-imports Next's bundled @vercel/og, which loads its
// font and wasm assets via a path built from `import.meta.url` at *import*
// time — before ImageResponse is even constructed. On Windows that path came
// out malformed (`ERR_INVALID_URL`), 500ing every card/OG route regardless of
// what the route itself did. `patches/next+14.2.35.patch` fixes it; this test
// exercises the real bundled module (unmocked) so a `next` version bump that
// drops the patch, or a bad patch regen, fails here instead of only in local
// dev on Windows.
describe("next/og ImageResponse", () => {
  it("constructs and streams a real PNG without throwing", async () => {
    const res = new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%" }}>LA-41</div>,
      { width: 1200, height: 630 }
    );

    expect(res.status).toBe(200);
    const bytes = await res.arrayBuffer();
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
