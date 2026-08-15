# TASK-314 — The duo panel

Depends on [TASK-312](./TASK-312-duo-synergy.md) and
[TASK-313](./TASK-313-duo-quests.md). Completes the duo work.

## Goal

Give the duo its own column on the dashboard, and enough in it that the page is obviously about
two players rather than one.

## Why a rail and not a widget

Everything else on the dashboard answers *how am I playing*. A duo answers *how are we playing* —
a different unit of analysis, which is why `DuoWidget` never worked as a third box in a row of
three: it sat at the same visual weight as a champion pool while saying something categorically
different, and had room for one sentence.

Layer 1 stays full width. Layers 2 and 3 now share a
`lg:grid-cols-[minmax(0,1fr)_336px]` with the rail, which is `lg:sticky lg:top-6` so it stays
beside whatever the player has scrolled to.

## What is in it

| Section | Answers |
|---|---|
| `DuoIdentity` | Who, plus a run of two or more wins/losses together |
| `DuoVerdict` | **The headline.** ±N win-rate points, together vs alone as two meters |
| `DuoFormShift` | What changes about *your* game with them — KDA, deaths, vision, CS/min, each against the same figure without them |
| `DuoPairs` | Which champion pairings win, and which roles they actually queue |
| `DuoQuestList` | This week's three quests with progress and days left |
| `DuoRecentGames` | The last five games together, both champions and the result |

`DuoFormShift` is the one that earns the space: "we won more" is the verdict above it, and this is
*why*. A partner who halves your CS is a different problem from one who gets you killed.

## What it refuses to say

Below five shared games the verdict is replaced by a sentence explaining that a verdict needs
five, and **the supporting sections are hidden too** — pairings and form shifts off four games
would be the same invented finding in smaller type. Never having played apart prints "No solo
games to compare against" rather than implying parity.

A failed request degrades to a single line saying the rest of the dashboard is unaffected, since
this is a side rail and not the page.

## On phones

The rail is `order-first`, so it lands under the decision panel and above the analysis rather
than below the entire match log. Verified at 390px: `scrollWidth === clientWidth`, the panel
measuring 350px inside a 390px viewport. TASK-295 was bitten by horizontal overflow here twice.

## Nothing lost

`DuoWidget` is deleted — the rail is a superset of everything it showed. `DuoPicker` is reused
unchanged for the no-duo and change-duo states.

## Tests

`DuoPanel.test.tsx` — the verdict for a dragging duo and a lifting one, the refusal to print off
too few games (including that the pairings stay hidden), "no solo games" instead of implied
parity, the form shift, pairings, the losing run, quest progress, the picker when no duo is
marked, and the contained error state.

## Verified in a browser

Signed in as `dev@lolai.test`, account `kaanproak0#TR1`, real synced history:

```
// VERDICT      -18   You win more without them
Together        51% · 73g
Alone           69% · 32g
// YOUR GAME WITH THEM   KDA 3.63 was 5.89  -2.26 …
// BEST TOGETHER   Alistar + Caitlyn 9g 78% …
// HOW YOU QUEUE   Support + Bot 25g · 52% …
// LAST GAMES TOGETHER   5 rows
```

The rail measured x=1080 w=336 at 1440px, and 390px showed no horizontal overflow.

## One thing not seen in a browser

`// THIS WEEK` did not render, because `GET /api/duo/quests` answered 500 on the running dev
server. Not a defect in this work: that server started at 00:07, and the Prisma client containing
`DuoQuest` was generated at 00:45, so its in-memory client has no such model. The same service
call succeeds in a fresh process against the same database (TASK-313's verification: XP 0 → 210,
then 0 on re-read), and `/api/public/search` — whose model was generated *before* that server
started — answers 200 from it. **Restart the dev server** and the section renders; the quest
rendering itself is covered by `DuoPanel.test.tsx`.

refs TASK-314
