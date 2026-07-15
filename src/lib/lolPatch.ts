// Riot switched to year-based patch numbering in Season 2025, but Data Dragon (and
// therefore op.gg's `version` field) still uses the old numbering. The mapping is a
// +10 offset on the major: Data Dragon "16.13" == in-game patch "26.13".
//
// We keep the raw Data Dragon numbering internally (cache keys, CDN URLs, op.gg trend
// version matching) and only convert to the game number for display.
export function formatGamePatch(version: string): string {
  const parts = version.split(".");
  const major = Number(parts[0]);
  const minor = parts[1];
  if (!Number.isFinite(major) || minor === undefined) return version;
  // The rename began with Data Dragon 15.x (in-game 25.x); older patches are unchanged.
  const gameMajor = major >= 15 ? major + 10 : major;
  return `${gameMajor}.${minor}`;
}

// "16.13.1" / "16.13" -> "26-13" for building the official patch-notes URL slug.
export function gamePatchSlug(version: string): string {
  return formatGamePatch(version).replace(".", "-");
}

// The official Riot patch-notes URL for a Data Dragon version (year-based slug).
export function patchNotesUrl(version: string): string {
  return `https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-${gamePatchSlug(version)}-notes/`;
}
