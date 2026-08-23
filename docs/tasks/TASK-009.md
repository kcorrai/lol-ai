# TASK-009 — AI Coaching Pipeline: Session Review

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 4 days

---

## Objective

Build the complete AI coaching pipeline for the Session Review report type. This is the product's core feature. A user requests analysis of their last 5 games and receives a structured coaching report written in a coaching voice.

---

## Acceptance Criteria

- [x] User can trigger report generation from the coaching page (button: "Analyze My Last 5 Games")
- [x] System fetches the user's last 5 ranked matches and their stats
- [x] A `coaching_reports` record is created with `status: 'processing'`
- [x] AI pipeline runs asynchronously and updates the report when complete
- [x] Report status can be polled via `GET /api/coaching/reports/:id/status`
- [x] Completed report contains: summary, strengths (2–3), weaknesses (2–3), 3 action items, coach narrative
- [x] All weaknesses have `evidence` field referencing real match data
- [x] Report is displayed in a well-designed UI with clear sections
- [ ] User can rate the report (1–5 stars) — not yet implemented
- [x] Freemium gate: 3 reports per month for free users (updated from 1/week)
- [x] AI response is cached: same 5 matches → same report (no double billing)
- [x] If AI fails: report status set to `failed`, user shown a friendly error

---

## Technical Requirements

### Pipeline Implementation

`src/domains/coaching/pipeline/`:

**`dataPreparator.ts`**

- Input: `riotAccountId`, `matchIds` (array of 5 UUIDs)
- Query MatchParticipant records for these matches
- Query player's champion stats + ranked history
- Build `CoachingInput` payload (see `AI_ARCHITECTURE.md`)
- Output: `CoachingInput` object

**`promptBuilder.ts`**

- Input: `CoachingInput` + `reportType` + optional `focusArea`
- Selects correct prompt template
- Injects structured data as JSON in user message
- Output: `AIRequest` (systemPrompt + userMessage)

**`responseParser.ts`**

- Input: raw AI response string
- Validates against `CoachingReportOutput` Zod schema
- Checks: evidence fields non-empty, exactly 3 action items, valid rank string
- Retry logic: if validation fails, build retry prompt
- Output: validated `CoachingReportOutput`

**`reportAssembler.ts`**

- Input: `CoachingReportOutput` + `CoachingInput` + `coaching_report.id`
- Merges AI output with statistical data
- Updates `coaching_reports` record in DB (status: complete, all fields)
- Persists `ai_analyses` record
- Output: final `CoachingReport` domain object

**`coachingService.ts`** (orchestrator)

```typescript
async function generateSessionReview(
  riotAccountId: string,
  matchIds: string[]
): Promise<{ reportId: string }>;
```

### System Prompt (Core)

Located in `src/domains/coaching/prompts/sessionReview.prompt.ts`.

See `AI_ARCHITECTURE.md` section 4.2 for the full system prompt template.

Key constraints:

- Temperature: 0.4 (consistent analysis)
- Max output tokens: 1,200
- Output format: JSON only

### Async Pattern (MVP)

Since we have no queue in MVP:

1. API route creates `coaching_report` with `status: 'processing'`
2. Returns 202 with `reportId`
3. Spawns background processing via `setImmediate` / promise (non-blocking)
4. Client polls `GET /api/coaching/reports/:id/status` every 3 seconds
5. When `status === 'complete'`, client fetches full report

---

## API Endpoints to Build

- `POST /api/coaching/generate`
- `GET /api/coaching/reports`
- `GET /api/coaching/reports/:reportId`
- `GET /api/coaching/reports/:reportId/status`
- `POST /api/coaching/reports/:reportId/rate`

---

## UI to Build

`src/domains/coaching/components/`:

- `GenerateReportButton` — triggers generation, shows loading state
- `ReportStatusPoller` — polls status, transitions to report view
- `CoachingReportView` — full report display
- `ReportSummaryCard` — summary + coach narrative section
- `StrengthsWeaknessList` — strengths/weaknesses with evidence
- `ActionItemList` — prioritized top 3 actions
- `ReportRatingWidget` — star rating input

Pages:

- `app/(app)/coaching/page.tsx` — list of reports + generate button
- `app/(app)/coaching/[reportId]/page.tsx` — single report view

---

## Testing Requirements

- Unit test `dataPreparator.ts`: correct input construction from match data
- Unit test `responseParser.ts`: valid schema passes, invalid triggers retry, retry passes, retry fails
- Unit test `promptBuilder.ts`: output contains all required data fields
- Integration test: full pipeline with mocked AI client → report persisted correctly

---

## Dependencies

- TASK-008 (AI client)
- TASK-005 (match data must exist)
- TASK-007 (champion stats for context)
- TASK-003 (coaching_reports, ai_analyses tables)

---

## Notes

This task must not ship if the AI report quality is below acceptable. Internal threshold: test with 10 real player accounts, require average self-rating of ≥ 3.8/5 before launching to users. This quality gate is non-negotiable.
