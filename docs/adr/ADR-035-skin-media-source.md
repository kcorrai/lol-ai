# ADR-035: Skin media comes from Community Dragon, not from a 3D model pipeline

## Status: Accepted

## Context

The champion page showed skins as a strip of Data Dragon splash art. Splash art is
promotional illustration — it is drawn, not rendered, and it tells a reader nothing about
what the skin looks like once they are in a game. That was the actual question being asked
of the section.

The obvious answer is a rotatable 3D model. It is not available:

- Riot publishes no champion models. Data Dragon is JSON and 2D images.
- Community Dragon mirrors the raw game files, and those are `.skn` meshes, `.skl`
  skeletons and `.dds`/`.png` textures — proprietary binary formats. Nothing web-ready.
  Confirmed against `raw.communitydragon.org/json/latest/game/assets/characters/ahri/skins/skin01/`,
  which lists exactly one `.skn`, three textures and a load screen.
- Converting them is a real pipeline: an out-of-band CLI (`lol2gltf`, `LeagueBulkConvert`)
  producing glTF, gigabytes of converted assets to host and version per patch, and a
  WebGL renderer — a new front-end dependency for one section of one page.
- The legal position is a grey area. Riot's Legal Jibber Jabber covers non-commercial fan
  projects; it does not say a third party may host extracted 3D assets, and this project
  bills for a plan.

The de-facto public viewer (`modelviewer.lol`) exists and does not send `X-Frame-Options`,
so it could be framed. That was rejected too: it means a `frame-src` grant, spending
someone else's bandwidth without their agreement, and a deep-link scheme that can change
without notice.

What Community Dragon _does_ publish, keyed by the champion's numeric Data Dragon id at
`/v1/champions/{key}.json`, is the client's own skin catalogue. Measured across all 2146
skins in `v1/skins.json`:

| Field                                                                     | Skins with it |
| ------------------------------------------------------------------------- | ------------- |
| `loadScreenPath` — the in-game loading card, a render of the actual model | 2146          |
| `tilePath` — the in-game HUD portrait                                     | 2146          |
| `uncenteredSplashPath`                                                    | 2146          |
| `chromas[]`                                                               | 1072          |
| `description`                                                             | 1831          |
| `rarity`                                                                  | 2146          |
| `skinFeaturePreviewData` — per-ability in-game VFX clips                  | 17            |
| `splashVideoPath` — animated splash                                       | 12            |

Animated splash and VFX clips are too rare to build a section on. The load screen is not:
it is a render of the model the game puts on the Rift, and every skin has one.

## Decision

Skin media comes from the Community Dragon champion catalogue. The load screen render is
the primary image — it leads the strip and opens as the default view in the inspector —
with splash and in-game tile as comparison views, chromas as swatches, and rarity, legacy
status and the skin's own description as supporting detail. VFX clips appear on the
17 skins that have them and are absent everywhere else.

No 3D model is rendered, converted, hosted or framed.

Two consequences follow from ADR-034 and are load-bearing:

- The catalogue is read with `fetchJsonLastGood`, never the framework fetch cache.
- `mergeSkinMedia` is pure and takes the catalogue as an argument, so the join is tested
  without a network call (CLAUDE.md 5.4) and an unreachable Community Dragon degrades to
  the Data Dragon splash gallery the section already was, rather than to an error.

## Consequences

**Gained.** Every skin gets an in-game view, on a catalogue Riot's own client uses, with
no new npm dependency, no asset hosting, no per-patch conversion job and no third-party
frame. `img-src` and `next/image` already trusted the host; only CSP `media-src` had to
be widened, and only for the VFX clips.

**Given up.** There is no rotation, no zoom, no animation cycling — a still render, not a
model. Readers who want that go to a dedicated viewer, and the page does not send them.

**Carried.** Community Dragon is a community mirror with no uptime guarantee, which the
degrade path is sized for. Asset paths are only served lowercased while the catalogue
writes them mixed-case; `cdragonAssetUrl` owns that rewrite and is the single place it
can break. The 8-value `rarity` enum is Riot's and can grow — an unrecognised value
renders no badge instead of throwing.
