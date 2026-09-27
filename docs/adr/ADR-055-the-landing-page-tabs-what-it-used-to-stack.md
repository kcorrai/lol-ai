# ADR-055: The landing page tabs what it used to stack

## Status: Accepted

## Context

The landing page had grown to seventeen sections: 10,300px on a 1440px desktop (about eleven
screens) and 19,900px on a 390px phone (about twenty-three), with some 2,200 words and 60
links. Each band was added for a sound reason — a shipped product nobody could find from the
front page — but the sum buried the one thing the page asks of a visitor, which is to paste a
Riot ID. Competing LoL and AI-coaching sites we looked at run between four and nine sections.

`docs/LANDING_REDESIGN_BRIEF.md` forbids dropping a section for tidiness, and allows merging,
reordering, resizing and re-ranking them.

## Decision

Seven bands move behind one row of tabs, `ExploreTabs`, in five tabs:

| Tab            | Bands                                   |
| -------------- | --------------------------------------- |
| Free tools     | `FreeToolsGrid`, `TierListPreview`      |
| Inside the app | `ProductShowcase`                       |
| Your account   | `AccountBand`, `ChampionPoolAudit`      |
| Academy        | `AcademyBand`                           |
| Daily game     | `DailyQuizStrip`                        |

Every band still renders in full on the server. Inactive panels stay in the DOM with `hidden`,
so their text is in the served HTML and their server-fetched data survives a tab switch. The
bands are not changed; `ExploreTabs` strips their page-level gutter with `[&>section]`
overrides.

`DataStrip` moves from under the hero to just above `ProvenanceStrip`, so only the three-step
strip sits between the hero and the sample report.

The page now reads: hero, how it works, sample report, human coaches, the six pillars
(`ArsenalTabs`), the desktop companion, the explore tabs, data and provenance, pricing, the
closing form.

## Consequences

- The desktop page drops to about 7,000px and the phone page to about 13,000px.
- A reader sees one explore panel at a time. Anything behind a closed tab needs a click; the
  free tools are the first tab because they need no account.
- Two tabbed sections now sit on one page. They are kept apart by `DesktopBand` and behave
  differently on purpose: `ArsenalTabs` auto-advances, `ExploreTabs` does not.
- A new landing band should join a tab before it gets its own section.
