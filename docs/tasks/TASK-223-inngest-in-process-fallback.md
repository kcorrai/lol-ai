# TASK-223 — Sync/report fail when Inngest is unavailable (local dev): in-process fallback

## Status: In Progress

## Problem

"Sync Now" fails on every account locally (8.png: "Sync failed"). Root cause from the dev log:
the connect-time sync succeeds because it runs **in-process** (`backgroundRefresh(syncAccount)`),
but the manual sync route only **fires an Inngest event** (`riot/sync.requested`). Locally the
Inngest dev server isn't running, so `inngest.send` throws `ECONNREFUSED` — the sync never runs and
the account is left failed/stuck. The report-generate route has the identical shape
(`coaching/report.requested`), so it breaks the same way once reachable.

## Fix

`dispatchOrRunInProcess(event, inProcessFn)` — try `inngest.send(event)`; if it throws (Inngest
down / local dev / outage) run `inProcessFn` in the background instead. Production (Inngest up) is
unchanged; local dev and outages degrade gracefully.

- Extract `runSyncWithStatus(riotAccountId, userId)` from `matchSyncWorker` into `matchSyncService`
  (RUNNING → syncAccount → COMPLETED / FAILED). The worker and the route's fallback share it.
- Sync route: `dispatchOrRunInProcess({name:"riot/sync.requested",...}, () => runSyncWithStatus(...))`.
- Report route: `dispatchOrRunInProcess({name:"coaching/report.requested",...}, () => runCoachingPipeline(...))`
  (`runCoachingJob` already just calls `runCoachingPipeline`).

## Deliverables

- `src/lib/inngest/dispatch.ts` + `dispatch.test.ts`.
- `matchSyncService.runSyncWithStatus`; `matchSyncWorker` uses it.
- `sync/route.ts` + `coaching/generate/route.ts` use `dispatchOrRunInProcess`.

## Verification

Local (no inngest-cli): "Sync Now" completes → status COMPLETED, matches appear. Report generation
kicks off the pipeline in-process. Unit test: `inngest.send` throws → `inProcessFn` runs.
