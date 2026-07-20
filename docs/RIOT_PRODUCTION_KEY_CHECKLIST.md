# Riot Production API Key — Pre-Application Checklist

Audited 2026-07-20 against Riot's live policy pages. Every claim below was
checked against this codebase, not assumed.

**Sources:** [Developer Portal](https://developer.riotgames.com/docs/portal) ·
[General Policies](https://developer.riotgames.com/policies/general) ·
[API Terms](https://developer.riotgames.com/terms) ·
[LoL Policies](https://developer.riotgames.com/docs/lol) ·
[GDPR RTBF](https://www.riotgames.com/en/DevRel/gdpr-right-to-be-forgotten-compliance)

---

## 🚫 Blocking — the application fails today without these

### B1. Production must be live and working

The only verbatim Riot rejection found in their public tracker
([#1139](https://github.com/riotgames/developer-relations/issues/1139), Feb 2026):

> "The link that you've included does not work or leads to a blank page. As it
> stands now we cannot verify what your project is intended to do."

Riot requires "a functioning website/application" whose user flows and legal
pages they can inspect by hand. Production is currently broken on two counts:

- `RIOT_API_KEY` in Vercel is expired → every Riot-backed feature 503s
- Neon is unreachable (transfer quota) → cache misses fail; the 200s currently
  served are stale ISR output masking a dead database

**Do not apply until a reviewer can load the site and use it.** See TASK-290.

### B2. Domain verification

Riot issues a string that must be served at a path on the domain you own
(`riot.txt`). No such file exists in `public/` yet — the content is supplied
during the application, so this is a step to perform, not something to pre-create.
An unverified domain means the application cannot be processed at all.

---

## ⚠️ Decisions only you can make

### D1. Product name and domain — "LoL AI Coach"

Riot's Legal Jibber Jabber policy states you "may not register domain names,
social media accounts, or similar stuff that uses Riot Games or any of our
trademarks, trade names, character names, etc."

That policy governs fan projects, and many approved products do use "lol" in
their names. **No Riot document resolves whether it binds API products.** An API
key is not a trademark licence, and Riot's trademark counsel is a different team
from Dev Relations.

Conservative path: rename to something without "LoL", "League of Legends" or
"Riot". Weigh that against the rebrand cost — this is a judgement call, not a
verified requirement.

### D2. Monetization — declare it explicitly

Two Riot documents conflict and nothing reconciles them:

- **Developer Policies:** "You may monetize your product as long as your product
  is registered on the Developer Portal and your product status is either
  Approved or Acknowledged."
- **API Terms:** if you "charge for access to Game Information … You must notify
  Riot and obtain Riot's prior written approval."

The defensible reading is that production approval *is* that written approval,
since the application form asks about monetization. **Declare the subscription
and B2B team plans on the form, and ask Dev Relations in writing.** Keep the
reply. Do not rely on inference for a revenue model.

### D3. B2B / team plans — ask directly

There is no public Riot policy covering team or esports-org products, and
**scouting — "seeing an opponent's stats before a match starts" — is explicitly
unapproved.** If any team feature surfaces opponent data, it is exposed. This
could not be resolved from public documentation; ask Dev Relations before
launching B2B.

---

## ✅ Verified compliant — no action needed

| Requirement | Status | Evidence |
|---|---|---|
| Approved use case | ✅ | Riot explicitly approves "training tools that allow players to view their own match histories and aggregate stats" |
| Post-game asynchronous coaching | ✅ | The preferred pattern; no live prescriptive direction |
| Exact disclaimer wording | ✅ | `MarketingFooter.tsx:76`, verbatim Riot text, visible sitewide |
| Terms of Service page | ✅ | `app/(marketing)/terms` |
| Privacy Policy page | ✅ | `app/(marketing)/privacy` |
| Free tier (mandatory) | ✅ | `SubscriptionPlan.free` is the default |
| Transformative paid tier | ✅ | Sells AI analysis, not access to raw Riot data |
| No MMR/ELO calculator (prohibited) | ✅ | Only match is the word "high-elo" in a prompt string |
| No gambling or betting | ✅ | No matches in codebase |
| No cryptocurrency or blockchain | ✅ | No matches in codebase |
| No player scouting | ✅ | See TASK-288 — live lookup is ownership-checked to your own account |
| GDPR right-to-be-forgotten | ✅ | TASK-287 — daily sweep, 30-day refresh window |
| LoL public match history | ✅ | Permitted without opt-in (unlike VALORANT). Custom-queue history is the only carve-out and is not surfaced |

---

## 📋 Application content — points to make explicitly

Pre-empt the misreadings a skimming reviewer is likely to make:

1. **The live-game lookup is not live assistance.** Manual, single-shot, no
   polling; ownership-checked to the applicant's own account; reads only champion
   identities already on the player's screen; drives general champion-matchup
   guidance, not real-time direction. (Full reasoning: TASK-288.)
2. **AI coaching is post-game and reflective.** It highlights decisions for
   later study rather than dictating them — Riot's Game Integrity rule allows
   products that "highlight decisions that are important" but not ones that
   "remove game decisions".
3. **GDPR RTBF is implemented,** not merely intended: daily sweep detecting the
   `rtbf<summonerID>` rename and 404s, purging associations within the 30-day
   window Riot recommends.
4. **Monetization is a free tier plus a transformative paid tier** — no gating of
   raw Riot data.

---

## ⏱ Expectations

Riot states reviews happen weekly, "up to three weeks" under load. Their own
public tracker tells a different story: 45 days, 6 weeks, and one case at
**5 months with no approval, rejection, or feedback** — with no Riot staff
replies on any of the wait-time threads.

**Plan for a quarter.** Do not sequence anything time-critical behind approval.

**Approval rates are not published.** No credible source has them; any percentage
quoted anywhere is fabricated.

## Sequencing note

Riot Sign-On (RSO) requires an already-approved production key — "RSO Clients are
only available for applications that have an existing, approved production
application ID." Anything depending on RSO cannot be built until after approval.

## Standing obligation

Riot owns all API data: "Riot owns all right, title and interest … in and to the
Materials, including all output and executables of the Riot Games API." On
termination you must "delete all of the Game Information in Your possession."
The match dataset is never ours, and that shapes any valuation or acquisition
conversation.
