import { describe, it, expect } from "vitest";
import {
  chatSubject,
  formatRiotId,
  resolveIdentity,
} from "@/domains/creator/redaction";

const RIOT = { gameName: "kaanproak0", tagLine: "TR1" };

describe("formatRiotId", () => {
  it("joins the two halves the way Riot writes them", () => {
    expect(formatRiotId("kaanproak0", "TR1")).toBe("kaanproak0#TR1");
  });
});

describe("resolveIdentity", () => {
  it("shows the Riot ID when stream-safe is off and no name was chosen", () => {
    const identity = resolveIdentity({ streamSafe: false, displayName: null, ...RIOT });

    expect(identity.name).toBe("kaanproak0#TR1");
    expect(identity.riotId).toBe("kaanproak0#TR1");
    expect(identity.redacted).toBe(false);
  });

  it("prefers a chosen display name while still carrying the Riot ID", () => {
    const identity = resolveIdentity({ streamSafe: false, displayName: "Kaan", ...RIOT });

    expect(identity.name).toBe("Kaan");
    expect(identity.riotId).toBe("kaanproak0#TR1");
  });

  // The point of the whole module.
  it("drops the Riot ID entirely when stream-safe is on", () => {
    const identity = resolveIdentity({ streamSafe: true, displayName: null, ...RIOT });

    expect(identity.riotId).toBeNull();
    expect(identity.name).toBeNull();
    expect(identity.redacted).toBe(true);
  });

  it("keeps a chosen display name under stream-safe but still drops the Riot ID", () => {
    const identity = resolveIdentity({ streamSafe: true, displayName: "Kaan", ...RIOT });

    expect(identity.name).toBe("Kaan");
    expect(identity.riotId).toBeNull();
    expect(identity.redacted).toBe(true);
  });

  it("never emits the game name under stream-safe, whatever else it returns", () => {
    for (const displayName of [null, "Kaan", "  "]) {
      const identity = resolveIdentity({ streamSafe: true, displayName, ...RIOT });
      expect(JSON.stringify(identity)).not.toContain(RIOT.gameName);
    }
  });

  it("treats a whitespace-only display name as unset", () => {
    expect(resolveIdentity({ streamSafe: false, displayName: "   ", ...RIOT }).name).toBe(
      "kaanproak0#TR1"
    );
    expect(resolveIdentity({ streamSafe: true, displayName: "   ", ...RIOT }).name).toBeNull();
  });

  it("trims a chosen display name", () => {
    expect(resolveIdentity({ streamSafe: false, displayName: " Kaan ", ...RIOT }).name).toBe(
      "Kaan"
    );
  });
});

describe("chatSubject", () => {
  it("uses the resolved name when there is one", () => {
    const identity = resolveIdentity({ streamSafe: false, displayName: "Kaan", ...RIOT });
    expect(chatSubject(identity)).toBe("Kaan");
  });

  // A chat line cannot start with an empty subject the way a widget can render
  // an empty row.
  it("falls back to a neutral subject when the name is redacted away", () => {
    const identity = resolveIdentity({ streamSafe: true, displayName: null, ...RIOT });
    expect(chatSubject(identity)).toBe("The streamer");
  });
});
