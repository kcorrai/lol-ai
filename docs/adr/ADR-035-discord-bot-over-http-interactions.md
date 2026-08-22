# ADR-035: Run the Discord bot as an HTTP interactions endpoint, deferred through Inngest

## Status: Accepted

## Context

The product already talks to Discord in one direction: `src/lib/discord/webhookService.ts`
pushes rank-up, achievement and weekly-recap embeds to a channel webhook the user
pastes into Settings. Nothing lets a person *in* a Discord server ask it anything.

Everything needed to answer already exists server-side. `buildAccountPreview()` returns
rank, top champions, recent form and a coaching read for any Riot ID with no account
required, and caches each target for a day. `searchPlayers()` is a Postgres prefix query
over every Riot ID seen in a synced match. What was missing was the Discord surface.

Discord offers two ways for a bot to receive events:

- **The Gateway** — a persistent WebSocket. Sees messages, presence and reactions.
- **The Interactions endpoint** — an HTTPS webhook. Sees slash commands, buttons,
  select menus, modals and autocomplete, and nothing else.

The Gateway needs a process that never exits. This app deploys to Vercel, where nothing
does. It would mean a second host, a second deploy pipeline, a second set of secrets, and
domain services reachable only over HTTP from outside the app.

The interactions endpoint fits inside the app as one route — but it has a hard rule: the
initial response must arrive **within 3 seconds** or the interaction token is invalidated
and the user sees "The application did not respond." A cold Vercel start plus a Prisma
connection plus a Riot round trip does not reliably fit inside that.

The standard answer is to acknowledge with a *deferred* response and finish the work
afterwards. On Vercel, work that is neither awaited nor handed to `waitUntil` can be
killed when the response is sent — two comments in this repo already say so
(`matchSyncService.ts`, `rankEnricher.ts`). But this app is on Next 14.2.35, which
predates `unstable_after`, and `@vercel/functions` (which exports `waitUntil`) is not a
dependency.

## Decision

**The bot is an HTTP interactions endpoint inside this Next.js app**, at
`app/api/discord/interactions/route.ts`. No gateway process, no second deploy target.

**The 3-second ACK is bought with Inngest**, which already runs 33 functions here:

```
Discord ──POST──> /api/discord/interactions
                  │ verify Ed25519 (node:crypto, ~1ms)
                  │ PING          → PONG
                  │ AUTOCOMPLETE  → answered inline (no deferred type exists)
                  │ COMMAND       → inngest.send(…) ; ACK type 5 (deferred)
                  │ BUTTON        → inngest.send(…) ; ACK type 6 (deferred update)
                  ▼
      src/inngest/functions/discordInteraction.ts
                  │ route → command handler → Components V2 payload
                  ▼
      PATCH /webhooks/{app_id}/{token}/messages/@original
```

**Presentation is Components V2** (`IS_COMPONENTS_V2`, `1 << 15`) rather than classic
embeds — accent-coloured containers, sections with their own thumbnail, separators and
buttons.

**No new npm dependencies.** Signature verification wraps Discord's raw 32-byte public key
in the fixed SPKI header for id-Ed25519 and calls `crypto.verify`, which is the whole of
what `discord-interactions` would have contributed.

## Consequences

**What this costs.**

- No message listening, no presence, no reactions, no "the bot posts when someone joins".
  If any of that is ever wanted it needs a gateway process, and this decision has to be
  revisited rather than extended.
- Every answer takes an extra Inngest hop, typically 1–3 seconds. Discord shows
  "LoL AI Coach is thinking…" for that time. Acceptable for a lookup; it would not be for
  a game.
- Local development needs `npx inngest-cli dev` running alongside `npm run dev`, or
  commands ACK and then never answer.
- Autocomplete is the one path that cannot defer, so it may only ever read the player
  index and must never call Riot.

**What it buys.**

- One deploy, one set of secrets, one codebase. Command handlers call
  `buildAccountPreview()` directly rather than over HTTP.
- Retries, timeouts and observability come from Inngest rather than being written here.
- Interaction tokens authenticate the reply on their own, so the runtime never holds a bot
  token. The token is needed only by `npm run discord:register`.

## Alternatives considered

**Add `@vercel/functions` for `waitUntil`.** One small official package, and it removes the
Inngest hop — the fastest option. Rejected because it ties the bot to Vercel's runtime for
a problem the project already has durable, observable, retrying infrastructure for, and
because a dropped background task fails silently where a dropped Inngest run does not.

**Upgrade Next.js for `unstable_after`.** A framework major to avoid one hop, in a repo
that pins `next` exactly because the framework major gates the React major.

**A separate discord.js gateway service.** The only option that supports message events.
Rejected for this scope: none of the commands need them, and it doubles the operational
surface for a feature that has yet to prove itself.

**Classic embeds instead of Components V2.** Less code and a proven path. Rejected because
"the bot should look good in Discord" was the requirement, and an embed cannot put a
thumbnail beside a section or tint a container by rank tier.
