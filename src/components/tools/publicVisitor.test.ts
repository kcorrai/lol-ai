import { describe, it, expect } from "vitest";
import type { Session } from "next-auth";
import { isPublicVisitor } from "./publicVisitor";

describe("isPublicVisitor", () => {
  it("treats a missing session as a public visitor", () => {
    expect(isPublicVisitor(null)).toBe(true);
  });

  it("treats a session without a user as public", () => {
    expect(isPublicVisitor({ expires: "" } as Session)).toBe(true);
  });

  it("treats a signed-in session as non-public", () => {
    expect(isPublicVisitor({ user: { id: "u1" }, expires: "" } as unknown as Session)).toBe(false);
  });
});
