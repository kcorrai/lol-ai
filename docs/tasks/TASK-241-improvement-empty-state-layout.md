# TASK-241 — Improvement page: no-account state uses the page container

## Problem
3.png: with no Riot account connected, "Improvement Tracking" hugged the far left of the
viewport while the "Riot account not connected" block centred itself against the full page width
— the two read as belonging to different layouts.

## Cause
The `!primaryAccount` branch returned a bare `<div className="space-y-6">`, skipping the
`mx-auto max-w-2xl px-4 py-8` container the loaded page uses.

## Change
`app/(app)/improvement/PageClient.tsx` — the no-account branch now renders inside the same
container as the loaded page, so header and empty state share one centred column.

refs TASK-241
