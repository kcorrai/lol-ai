# TASK-150 — Büyük Dosyaları Böl (Dosya Boyutu İhlalleri)

**Phase:** 5
**Status:** Todo
**Priority:** P4
**Puan:** 35/100

## Objective

CLAUDE.md limitleri aşılan dosyalar (component max 200, service max 250 satır):

| Dosya | Satır | Limit |
|---|---|---|
| `app/(app)/settings/security/page.tsx` | 371 | 200 |
| `app/(app)/match/[matchId]/page.tsx` | 350 | 200 |
| `app/(app)/milestone/page.tsx` | 342 | 200 |
| `app/u/[slug]/page.tsx` | 340 | 200 |
| `src/domains/analysis/services/challengeService.ts` | 391 | 250 |
| `src/domains/riot/services/matchSyncService.ts` | 380 | 250 |

## Acceptance Criteria

- Her dosya limit içine alındı (sub-component extraction veya service split)
- Extract edilen parçalar aynı domain klasöründe
- Davranış değişmedi (test coverage korundu)
