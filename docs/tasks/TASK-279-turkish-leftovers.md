# TASK-279 — Remaining Turkish strings in the UI

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #20 (score 22), which reported one line. There were
four.

## What was found

Phase 6 (TASK-166..178) made the repo English and was verified by reading rendered pages. Four
strings survived that, and the reason each survived is worth noting — it says where the next one
will be.

| File | String | Why it was missed |
|---|---|---|
| `app/(app)/recap/page.tsx:4` | `title: "Sezon Recap"` | Page *metadata*, not page content — it renders in the browser tab, not the viewport |
| `src/components/achievements/AchievementToast.tsx:56` | `aria-label="Kapat"` | **Only ever exposed to a screen reader.** Invisible to any visual review |
| `src/components/layout/RiotAccountSelector.tsx:62` | `"Senkronize ediliyor…"` | Transient — shows for 4s after a successful sync |
| `src/components/layout/RiotAccountSelector.tsx:65` | `"Hata"` | Only rendered on a sync failure |

The pattern: everything left was **outside the default visual render** — metadata, an ARIA label,
and two transient states behind a success/failure branch. A visual sweep structurally cannot find
these.

A search for Turkish-specific characters (`ı ğ ş İ Ğ Ş`) returns **nothing** — all four happen to be
spelled in plain ASCII, so the obvious grep is useless here. Word-list search is what found them.

`"Hata"` became `"Sync failed"` rather than a literal `"Error"`, matching the vocabulary already
used in `ConnectedAccountsList` ("Sync failed — try again with 'Sync Now'").

## Acceptance criteria

- [x] All four replaced.
- [x] Word-list sweep returns zero.
- [x] Full suite, typecheck, lint clean.
