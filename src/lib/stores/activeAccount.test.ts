import { describe, expect, it } from "vitest";
import { isStaleActiveAccountId, resolveActiveAccountId } from "./activeAccount";

const ACCOUNTS = [{ id: "a" }, { id: "b" }];

describe("resolveActiveAccountId", () => {
  it("keeps a selection that still exists", () => {
    expect(resolveActiveAccountId(ACCOUNTS, "b")).toBe("b");
  });

  it("falls back to the first account when nothing is selected", () => {
    expect(resolveActiveAccountId(ACCOUNTS, null)).toBe("a");
  });

  it("ignores a selection that matches no account", () => {
    // The bug this exists for: a localStorage id from a previous database used to win
    // here, and every request for it came back 403.
    expect(resolveActiveAccountId(ACCOUNTS, "gone")).toBe("a");
  });

  it("returns null while the account list is unknown or empty", () => {
    expect(resolveActiveAccountId(undefined, "a")).toBeNull();
    expect(resolveActiveAccountId([], "a")).toBeNull();
  });
});

describe("isStaleActiveAccountId", () => {
  it("is true only for a selection the list does not contain", () => {
    expect(isStaleActiveAccountId(ACCOUNTS, "gone")).toBe(true);
    expect(isStaleActiveAccountId(ACCOUNTS, "a")).toBe(false);
  });

  it("is false when nothing is selected yet", () => {
    expect(isStaleActiveAccountId(ACCOUNTS, null)).toBe(false);
  });

  it("is false before the accounts have loaded, so a refetch cannot clear the choice", () => {
    expect(isStaleActiveAccountId(undefined, "a")).toBe(false);
    expect(isStaleActiveAccountId([], "a")).toBe(false);
  });
});
