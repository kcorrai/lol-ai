# ADR-021: We host no video

## Status: Accepted

## Context

Three session kinds need delivering: an async replay review, a live 1:1 call and
live game spectating. The obvious build for the first two is an uploader and an
embedded video SDK.

Two earlier decisions already point the other way. **ADR-007** declined replay
upload analysis after costing it: 50–200 MB per `.rofl` file, and the useful
part duplicated what the Riot API gives for free. **ADR-018** settled the
esports section on click-to-load embeds of the rightsholder's own player, with
`docs/ESPORTS_PLAN.md` §5 stating "we host, re-encode and re-serve nothing".

Current pricing was checked rather than assumed. Video calls: Daily.co at
$0.004/participant-minute with 10,000 free per month, LiveKit self-hostable,
Zoom Video SDK at $0.0035. Storage: Mux from $0.0024/minute stored with 100,000
free delivery minutes, Cloudflare Stream at $0.005 stored and $0.001 delivered.
None of it is expensive at small scale. All of it is a dependency, an API key,
a bill that scales with usage, and a thing to be responsible for.

## Decision

**No video is hosted, transcoded or served, and no video SDK is taken on.**

- **Async review** points at a match id of ours or a link the student supplies.
  Notes carry a second on the game clock; the student scrubs their own replay.
- **Live session** happens on a meeting link the coach supplies. The booking
  carries `meetingUrl` and `meetingProvider`, and the link becomes a join button
  only in a window around the session's own time.
- **Live spectating** happens in the coach's own client. The platform answers
  the question that is otherwise a scramble in a DM: is the student in a game
  right now, and how far in.

`meetingProvider` defaults to `"external"` and exists so an embedded provider
can be added without a migration.

## Consequences

**Positive.** No new dependency, no storage bill, no transcoding pipeline, and
nothing to be responsible for hosting. A coach uses the tool they already use.
The async product — the one this codebase is best placed to do well — needs none
of it: Metafy's own async offering is a timestamped document.

**Negative.** The live session leaves the platform, so we cannot record it, we
cannot prove it happened, and a dispute about a live session rests on the
booking's recorded history rather than on a recording. That is a real
limitation and the dispute flow is built knowing it. A coach must remember to
set a link; the session page nags them, because a student waiting at the right
time in the wrong place is indistinguishable from a no-show.

**When to revisit.** If disputes about live sessions become common, a recorded
in-platform room stops being a luxury. Daily.co for an MVP and self-hosted
LiveKit at scale are the shapes that were priced.
