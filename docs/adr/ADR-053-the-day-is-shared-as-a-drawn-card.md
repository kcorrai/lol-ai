# ADR-053: The day's result is shared as a drawn card

## Status: Accepted

## Context

The quiz ended on a `<pre>` block of emoji squares — the Wordle grid, copied to
the clipboard. It is the right thing to paste into Discord and the wrong thing to
look at: the last frame of a solved puzzle was a wall of monospace text, and
nothing about it invited anyone to post it.

A picture was the obvious answer, and there are two ways to get one. The page can
draw the card in CSS and export a second, separately written copy of the same
design as an image, or the image can be the only design and the page can show it.
The first looks better on screen — it can animate, it reflows, its text is
selectable — at the cost of two implementations of one card that will drift the
first time either is touched.

## Decision

One design: `GET /api/quiz/share` draws the card with `next/og`, and the page
shows that image. What the player looks at is byte-for-byte the file they post.

The model behind it lives in `src/domains/quiz/services/shareCard.ts` and is
pure, so the page, the image and the tests all count the day the same way. Every
element on the card is a drawn box or a run of text — no remote images, no emoji
glyphs, no web fonts — so it renders identically everywhere and cannot be held up
by a Data Dragon or Google Fonts request. The whole state travels in the query
string; nothing is signed, because a forged card can only claim a day that did
not happen, on a picture that names no champion either way.

`shareGrid.ts` stays exactly as it was. The emoji block is still what a Discord
message wants, and it is one click away under the card.

## Consequences

- The card's look is fixed at satori's flexbox subset and the system font stack,
  which is a plainer face than the site's Orbitron. Embedding the real font means
  shipping the binary or fetching it at render time; neither is worth it for a
  card this size, and every other OG surface in the repo already renders this way.
- Copying the image is a `ClipboardItem` write, which Firefox and most embedded
  browsers refuse; those fall through to a download, and the native share sheet is
  offered only where `navigator.canShare` accepts files.
- The on-screen card cannot animate or reflow its text, and a slow first render is
  a visible blank behind a skeleton. The query fully determines the picture, so it
  is cached immutably and only the first player of a given day pays for it.
