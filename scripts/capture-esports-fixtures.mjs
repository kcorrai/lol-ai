// Captures a trimmed, replayable snapshot of the two esports feeds for E2E.
//
// The section is a cache over feeds we do not own (ADR-016), and CLAUDE.md 5.4
// forbids a test making a real network call. So the E2E run replays fixtures
// instead, and this script is how they are refreshed when the feed moves.
//
//   node scripts/capture-esports-fixtures.mjs
//
// Not run in CI, and not run by the test suite: it talks to the live feed on
// purpose. Commit whatever it writes.
//
// Everything is trimmed hard. getTeams alone is 1.5 MB live, and a fixture is
// only useful if a human can read the diff when it changes.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ESPORTS_BASE = "https://esports-api.lolesports.com/persisted/gw";
const LIVESTATS_BASE = "https://feed.lolesports.com/livestats/v1";
const KEY = process.env.LOLESPORTS_API_KEY || "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z";
const OUT = join(process.cwd(), "tests", "e2e", "fixtures", "esports");

// The league the fixtures are built around. LEC is the safe choice: it runs a
// round-robin split, so it is one of the few that publishes a standings table
// (a bracket-only league would give us an empty one), and it is `selected` in
// the feed's own display bands.
const LEAGUE_SLUG = "lec";
// How many entries survive the trim, per collection.
const TEAMS = 12;
const SCHEDULE_EVENTS = 40;
const VOD_SERIES = 8;

async function get(base, path, params = {}) {
  const url = new URL(`${base}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, v);
  }
  const headers = { "User-Agent": "laneiq (+https://lolaicoach.gg)", Accept: "application/json" };
  if (base === ESPORTS_BASE) headers["x-api-key"] = KEY;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${path} responded ${response.status}`);
  return response.json();
}

async function write(name, payload) {
  const body = JSON.stringify(payload, null, 1);
  await writeFile(join(OUT, `${name}.json`), `${body}\n`, "utf8");
  console.log(`  ${name}.json  ${(body.length / 1024).toFixed(1)} KB`);
}

await mkdir(OUT, { recursive: true });
console.log("capturing esports fixtures\n");

// ── leagues ──────────────────────────────────────────────────────────────────
const leagues = await get(ESPORTS_BASE, "getLeagues", { hl: "en-US" });
await write("getLeagues", leagues);

const league = leagues.data.leagues.find((l) => l.slug === LEAGUE_SLUG);
if (!league) throw new Error(`league ${LEAGUE_SLUG} is no longer in the feed`);
console.log(`  league: ${league.name} (${league.id})`);

// ── tournaments + standings ──────────────────────────────────────────────────
const tournaments = await get(ESPORTS_BASE, "getTournamentsForLeague", {
  hl: "en-US",
  leagueId: league.id,
});
await write("getTournamentsForLeague", tournaments);

// The most recent tournament with a start date in the past — an unstarted split
// has no standings and no results, which makes for a fixture with nothing in it.
const started = tournaments.data.leagues[0].tournaments
  .filter((t) => Date.parse(t.startDate) <= Date.now())
  .sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate));
const tournament = started[0];
if (!tournament) throw new Error("no started tournament for this league");
console.log(`  tournament: ${tournament.slug} (${tournament.id})`);

await write(
  "getStandings",
  await get(ESPORTS_BASE, "getStandings", { hl: "en-US", tournamentId: tournament.id })
);

// ── schedule ─────────────────────────────────────────────────────────────────
// Kept as the tail of the list, which is where the feed puts the events nearest
// to now — the head is the opening week of the split and long over.
const schedule = await get(ESPORTS_BASE, "getSchedule", { hl: "en-US", leagueId: league.id });
const events = schedule.data.schedule.events;
schedule.data.schedule.events = events.slice(-SCHEDULE_EVENTS);
await write("getSchedule", schedule);

// ── one completed match, with its games ──────────────────────────────────────
const completed = [...schedule.data.schedule.events]
  .reverse()
  .find((e) => e.state === "completed" && e.match?.id);
if (!completed) throw new Error("no completed match in the captured schedule window");

const details = await get(ESPORTS_BASE, "getEventDetails", { hl: "en-US", id: completed.match.id });
await write("getEventDetails", details);
console.log(`  match: ${completed.match.id}`);

// ── livestats for that match's first completed game ──────────────────────────
const games = details.data.event.match.games.filter((g) => g.state === "completed");
const game = games[0];
if (!game) throw new Error("the captured match publishes no completed game");

// `window` with no startingTime answers from the game's opening frames; that is
// what the duration derivation reads, so the fixture has to carry it too.
const openingWindow = await get(LIVESTATS_BASE, `window/${game.id}`);
await write(`window-${game.id}-opening`, openingWindow);

// The closing frames need a startingTime at or after the last frame. Asking for
// a time past the end of the game returns the final window, which is what the
// scoreboard and the stat sheet are built from.
const endingAt = new Date(Date.parse(openingWindow.frames.at(-1).rfc460Timestamp) + 60 * 60 * 1000);
const closingTime = roundToTenSeconds(endingAt);
await write(`window-${game.id}-closing`, await get(LIVESTATS_BASE, `window/${game.id}`, {
  startingTime: closingTime,
}));
// Only the final frame of the details payload is read (`gameStatsMapper`), and
// each frame carries the full per-player stat line for ten players — keeping the
// other nine would triple the fixture directory for nothing.
const closingDetails = await get(LIVESTATS_BASE, `details/${game.id}`, {
  startingTime: closingTime,
});
await write(`details-${game.id}-closing`, {
  ...closingDetails,
  frames: closingDetails.frames.slice(-1),
});

// ── the gold-curve walk ──────────────────────────────────────────────────────
// The walk's request times are derived from the game's opening frame plus a
// fixed four-minute step (timelineService), so they are the same every run and
// can be captured exactly rather than approximated. Frames keep their team
// totals and lose their `participants` arrays, which the walk never reads and
// which are nine tenths of the bytes.
const SAMPLE_INTERVAL_SECONDS = 4 * 60;
const MAX_SAMPLES = 24;
const gameStartedAt = openingWindow.frames[0].rfc460Timestamp;
const walk = [];

for (let step = 1; step <= MAX_SAMPLES; step += 1) {
  const at = new Date(Date.parse(gameStartedAt) + step * SAMPLE_INTERVAL_SECONDS * 1000);
  if (at.getTime() > Date.now() - 2 * 60 * 1000) break;

  const startingTime = roundToTenSeconds(at);
  const payload = await get(LIVESTATS_BASE, `window/${game.id}`, { startingTime });
  const frames = payload.frames.map((frame) => ({
    ...frame,
    blueTeam: stripParticipants(frame.blueTeam),
    redTeam: stripParticipants(frame.redTeam),
  }));
  await write(`walk-${game.id}-${step}`, { ...payload, frames });
  walk.push({ step, startingTime });

  if (frames.at(-1)?.gameState === "finished") break;
}
console.log(`  walk: ${walk.length} samples`);

// ── teams ────────────────────────────────────────────────────────────────────
// 1568 teams live, 1.5 MB. Only the ones the captured schedule actually points
// at need to resolve, topped up from the league's own roster-carrying teams so
// the index has something to list.
const teams = await get(ESPORTS_BASE, "getTeams", { hl: "en-US" });
const referenced = new Set();
for (const event of schedule.data.schedule.events) {
  for (const team of event.match?.teams ?? []) referenced.add(team.code);
}

const indexable = (t) => t.homeLeague && Array.isArray(t.players) && t.players.length > 0;
const inLeague = teams.data.teams.filter((t) => indexable(t) && t.homeLeague.name === league.name);
const kept = new Map();
for (const team of teams.data.teams) {
  if (referenced.has(team.code) && indexable(team)) kept.set(team.id, team);
}
for (const team of inLeague) {
  if (kept.size >= TEAMS) break;
  kept.set(team.id, team);
}
teams.data.teams = [...kept.values()];
await write("getTeams", teams);
console.log(`  teams: ${teams.data.teams.length} kept of ${TEAMS} target`);

// ── VOD archive ──────────────────────────────────────────────────────────────
const vods = await get(ESPORTS_BASE, "getVods", { hl: "en-US" });
vods.data.schedule.events = vods.data.schedule.events.slice(0, VOD_SERIES);
await write("getVods", vods);

// ── the manifest the replay layer reads ──────────────────────────────────────
// `capturedAt` is what lets the replay rebase every kickoff time onto the run's
// own clock. Without it a fixture's "upcoming" matches become past ones the
// week after capture, and the schedule's upcoming section empties out.
await write("manifest", {
  capturedAt: new Date().toISOString(),
  leagueId: league.id,
  leagueSlug: league.slug,
  tournamentId: tournament.id,
  matchId: completed.match.id,
  gameId: game.id,
  gameStartedAt,
  closingTime,
  walk,
});

console.log(`\ndone — ${OUT}`);

/** Per-player state, which the walk never reads and which is most of the bytes. */
function stripParticipants(team) {
  const { participants, ...rest } = team ?? {};
  return rest;
}

/** The livestats feed only answers on ten-second boundaries and 400s otherwise. */
function roundToTenSeconds(date) {
  const rounded = new Date(Math.floor(date.getTime() / 10_000) * 10_000);
  return `${rounded.toISOString().slice(0, 19)}Z`;
}
