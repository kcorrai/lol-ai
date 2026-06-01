# TASK-005 — Match Analysis & AI Coaching Pipeline

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 2 days

---

## Objective

Convert raw Riot match data into structured AI coaching insights. Build the full pipeline from performance metric extraction through to persisted `CoachingReport` records.

---

## Acceptance Criteria

- [x] `performanceCalculator.ts` — pure functions: KDA, damage share, kill participation, consistency, death cluster, notable events, strongest/weakest area
- [x] `playstyleClassifier.ts` — classifies player as aggressive / farming / supportive / passive / balanced from aggregate metrics
- [x] `matchAnalysisService.ts` — aggregates last N matches into `PlayerPerformanceProfile` with all computed metrics
- [x] `dataPreparator.ts` — builds `CoachingInput` JSON payload from DB records + rank benchmarks; applies token-budget compression
- [x] `promptBuilder.ts` — constructs `{systemPrompt, userMessage}` from `CoachingInput` + `ReportType`; includes anti-hallucination constraints and JSON output schema
- [x] `src/lib/ai/types.ts` — `AiProvider` interface + `AiCompletionResult` type
- [x] `src/lib/ai/providers/openai.ts` — OpenAI GPT-4o provider implementation (json_object response mode)
- [x] `src/lib/ai/client.ts` — provider factory reading `AI_PROVIDER` env var
- [x] `src/lib/ai/responseParser.ts` — extracts JSON from raw AI text, validates against `CoachingReportOutput` schema
- [x] `coachingPipeline.ts` — full orchestrator: build input → build prompt → check hash cache (AiAnalysis) → call AI → parse response → update CoachingReport to complete/failed
- [x] `/api/coaching/generate` updated to fire-and-forget the pipeline after creating a pending report
- [x] Bug fix: `promptBuilder.ts` `input.currentRank` → `input.player.currentRank`
- [x] Vitest test setup (`vitest.config.ts`, test scripts in `package.json`)
- [x] 43 unit tests across 4 files: `performanceCalculator`, `playstyleClassifier`, `responseParser`, `coachingPipeline`
- [x] `docs/DEPENDENCIES.md` created documenting `openai` + Vitest rationale

---

## Files Created

```
src/lib/ai/types.ts
src/lib/ai/client.ts
src/lib/ai/responseParser.ts
src/lib/ai/providers/openai.ts
src/domains/coaching/pipeline/coachingPipeline.ts
src/domains/analysis/calculators/performanceCalculator.test.ts
src/domains/analysis/calculators/playstyleClassifier.test.ts
src/lib/ai/responseParser.test.ts
src/domains/coaching/pipeline/coachingPipeline.test.ts
vitest.config.ts
docs/DEPENDENCIES.md
```
