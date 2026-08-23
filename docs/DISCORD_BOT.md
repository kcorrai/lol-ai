# Discord Bot — setup and operation

The bot answers slash commands inside Discord. It runs as an HTTP interactions endpoint
inside this Next.js app — see [ADR-035](./adr/ADR-035-discord-bot-over-http-interactions.md)
for why, and for what that rules out.

---

## 1. Commands

| Command                                   | Needs a link?    | Reads                                                 |
| ----------------------------------------- | ---------------- | ----------------------------------------------------- |
| `/rank [riot-id] [region]`                | no               | `buildAccountPreview()`                               |
| `/profile [riot-id] [region]`             | no               | `buildAccountPreview()`                               |
| `/champions [riot-id] [region]`           | no               | `buildAccountPreview()`                               |
| `/match [riot-id] [region]`               | no               | `getLastMatchSummary()` — one match-v5 call           |
| `/live [riot-id] [region]`                | no               | `getLiveDraftForRiotId()` — spectator-v5              |
| `/coach`                                  | **yes**, and Pro | `getPlayerPerformanceProfile()` + `getActiveHabits()` |
| `/lolai help \| link \| status \| unlink` | —                | —                                                     |

`riot-id` is optional everywhere. Left out, it answers for the caller's own linked account.
It autocompletes from the player index (`searchPlayers()`), which holds every Riot ID seen
in a synced match. `region` is optional too — when it is missing the index is asked which
shard that Riot ID was last seen on, and only then does it fall back to EUW.

---

## 2. Creating the Discord application

At <https://discord.com/developers/applications> → **New Application**.

**General Information** — this is the half of "looking good" that no code can do:

- **Name** — what appears above every reply.
- **App Icon** — the avatar next to every reply. Use the product mark, not a placeholder.
- **Description** — shown in the "Add App" dialog and the profile popout. Say what it does
  in one line: _Rank, match and live-game lookups for League of Legends, with AI coaching._
- Copy the **Application ID** → `DISCORD_APPLICATION_ID`
- Copy the **Public Key** → `DISCORD_PUBLIC_KEY`

**Bot** tab:

- **Reset Token**, copy it → `DISCORD_BOT_TOKEN`. This is only used by the registration
  script; the running app never needs it, because interaction tokens authenticate replies
  on their own.
- Privileged intents are **not** needed. This bot receives no gateway events.

**Installation** tab:

- Install contexts: **Guild Install** and **User Install** (the commands are registered
  with `integration_types: [0, 1]`, so both work).
- Scopes: `applications.commands` and `bot`.
- Bot permissions: **Send Messages**, **Embed Links**, **Use External Emojis**.

---

## 3. Wiring the interactions endpoint

**Interactions Endpoint URL** on the General Information tab:

```
https://<your-domain>/api/discord/interactions
```

Discord immediately POSTs a PING signed with a valid signature, and a second one signed
with a deliberately invalid signature. It saves the URL only if the first is answered with
a PONG and the second is rejected with a 401. If saving fails, the cause is almost always
`DISCORD_PUBLIC_KEY` being unset or wrong on that deployment.

---

## 4. Registering the commands

```bash
npm run discord:register                    # global — up to an hour to appear
npm run discord:register -- --guild <id>    # one guild — instant
```

Use `--guild` while iterating; global is what ships. The call is a `PUT` of the whole set,
so a command removed from `src/domains/discord/commandDefinitions.ts` disappears from
Discord on the next run.

---

## 5. Running it locally

Three things have to be up at once:

```bash
npm run dev                 # port 3001
npx inngest-cli dev         # or every command ACKs and never answers
# plus a tunnel — Discord must be able to reach the endpoint over HTTPS
```

Point the Interactions Endpoint URL at the tunnel, register the commands to a test guild,
and set `NEXT_PUBLIC_APP_URL` to the tunnel URL so the link buttons resolve.

`/lolai link` additionally needs `AUTH_ENCRYPTION_KEY` set — it signs the link token. See
the note in `.env.example`.

---

## 6. Environment variables

| Variable                 | Needed by                 | Notes                                    |
| ------------------------ | ------------------------- | ---------------------------------------- |
| `DISCORD_APPLICATION_ID` | runtime + register script | Same value as `DISCORD_CLIENT_ID`        |
| `DISCORD_PUBLIC_KEY`     | runtime                   | Every request is rejected without it     |
| `DISCORD_BOT_TOKEN`      | register script only      | Never read at runtime                    |
| `AUTH_ENCRYPTION_KEY`    | `/lolai link`             | Already required by 2FA                  |
| `NEXT_PUBLIC_APP_URL`    | link buttons              | Must be reachable by the person clicking |

---

## 7. Account linking

`/lolai link` posts an ephemeral button to `/settings/discord/link?token=…`. The token is
the caller's Discord id and display name, encrypted with `AUTH_ENCRYPTION_KEY` and good
for ten minutes. The page requires a signed-in session; confirming there writes
`discordUserId` onto that user's `discord_integrations` row.

There is no OAuth round trip because there is nothing to prove: the interaction payload
already establishes who the Discord user is. The token carries that claim to the browser
unforgeably, and the session supplies the other half. A Discord account already linked to
another profile is refused, not moved.

Unlinking clears the two columns but keeps the row when a channel webhook is still on it,
and clearing the channel webhook from Settings keeps the row when a link is on it. The two
features share a table and must not switch each other off.

---

## 8. Operating notes

- **Rate limit** — 20 commands per Discord user per minute, through the shared Upstash
  limiter (`discord-bot:<discordUserId>`). It protects the Riot key, which a whole server
  shares.
- **Failures are ephemeral.** A mistyped Riot ID should not leave a red box in the channel.
  Successful lookups are public.
- **Inngest is on the critical path.** If `/api/inngest` is down, every command ACKs and
  then never answers. That shows in Discord as a permanent "thinking…".
- **Images come from Data Dragon and Community Dragon** via `src/lib/ddragon.ts`. Discord
  fetches them itself, so a broken CDN shows as a missing thumbnail rather than a failure.
