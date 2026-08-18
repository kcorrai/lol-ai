import { describe, expect, it } from "vitest";
import { ROLE_IDS, ROLE_LABEL, roleFromPosition } from "./roles";
import { TRACKS, coreTracks, isRolePath, roleTracks, roleTracksFor, trackForRole } from "./curriculum";

describe("role mapping", () => {
  it("maps every Riot position onto a role the Academy names", () => {
    expect(roleFromPosition("TOP")).toBe("top");
    expect(roleFromPosition("JUNGLE")).toBe("jungle");
    expect(roleFromPosition("MIDDLE")).toBe("mid");
    expect(roleFromPosition("BOTTOM")).toBe("adc");
    expect(roleFromPosition("UTILITY")).toBe("support");
  });

  it("has no role for a player we cannot read one from", () => {
    expect(roleFromPosition(null)).toBeNull();
  });

  it("labels every role", () => {
    for (const role of ROLE_IDS) expect(ROLE_LABEL[role].length).toBeGreaterThan(0);
  });
});

describe("role paths", () => {
  // The id *is* the role, so a path can never be filed under a role it is not about.
  it("gives every role path an id equal to its role", () => {
    for (const track of roleTracks()) expect(track.id).toBe(track.role);
  });

  it("splits the registry into the curriculum and the paths, with nothing left over", () => {
    expect(coreTracks().length + roleTracks().length).toBe(TRACKS.length);
    expect(coreTracks().some(isRolePath)).toBe(false);
  });

  it("finds a path by role and returns null for one that has not been written yet", () => {
    for (const track of roleTracks()) expect(trackForRole(track.role)).toBe(track);
    const missing = ROLE_IDS.filter((role) => trackForRole(role) === null);
    for (const role of missing) expect(roleTracks().some((t) => t.role === role)).toBe(false);
  });

  it("puts the player's own path first and leaves the rest in registry order", () => {
    const written = roleTracks();
    if (written.length === 0) return;

    const mine = written[written.length - 1].role;
    const ordered = roleTracksFor(mine);

    expect(ordered[0].role).toBe(mine);
    expect(ordered).toHaveLength(written.length);
    expect(new Set(ordered)).toEqual(new Set(written));
  });

  it("keeps registry order when there is no role to sort by", () => {
    expect(roleTracksFor(null)).toEqual(roleTracks());
  });
});
