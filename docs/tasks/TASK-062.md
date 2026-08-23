# TASK-062 â€” [F2-2] draftAnalysisService + draftPrompt

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 1 day

---

## Objective

Draft Analyzer'Ä±n iÅŸ mantÄ±ÄŸÄ±nÄ± yaz. 10 champion'lÄ± iki takÄ±m giriÅŸi alarak takÄ±m kompozisyon gÃ¼Ã§leri, win conditions, scaling ve risk analizi Ã¼ret.

---

## Acceptance Criteria

- [ ] `src/domains/draft/services/draftAnalysisService.ts` yazÄ±ldÄ±
- [ ] `analyzeDraft(input)` tÃ¼m 10 pozisyonun dolu olduÄŸunu validate ediyor
- [ ] Duplicate champion kontrolÃ¼ yapÄ±lÄ±yor
- [ ] Cache hit durumunda AI Ã§aÄŸrÄ±lmÄ±yor (TTL: 7 gÃ¼n)
- [ ] AI Ã§Ä±ktÄ±sÄ± Zod ile validate ediliyor
- [ ] `src/domains/draft/prompts/draftPrompt.ts` yazÄ±ldÄ±
- [ ] Prompt takÄ±m kompozisyon skorlarÄ±nÄ± 1-10 sayÄ±sal olarak talep ediyor
- [ ] `draftAnalysisService.ts` 250 satÄ±rÄ± geÃ§miyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

### Servis (`draftAnalysisService.ts`)

```typescript
export async function analyzeDraft(input: DraftInput): Promise<DraftAnalysis>;
```

Validation:

```typescript
const positions: Position[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
// Her iki takÄ±mda tÃ¼m pozisyonlar dolu olmalÄ±
// TÃ¼m 10 champion unique olmalÄ± (set check)
```

Cache key:

```typescript
const allChampions = [
  ...positions.map((p) => input.blueTeam[p].toLowerCase()),
  ...positions.map((p) => input.redTeam[p].toLowerCase()),
].sort();
buildCacheKey("draft", { champions: allChampions.join(",") });
```

TTL: 7 gÃ¼n (draft meta daha hÄ±zlÄ± deÄŸiÅŸir).

### Prompt (`draftPrompt.ts`)

`buildDraftUserPrompt(blueTeam, redTeam)`:

Pozisyon bazlÄ± iki takÄ±mÄ± listele, ardÄ±ndan ÅŸunlarÄ± iste:

- `blueTeamComposition` ve `redTeamComposition`: 5 metrik 1-10 arasÄ± + summary
- `blueWinConditions[]` ve `redWinConditions[]`: primary + secondary, nasÄ±l elde edilir
- `blueScaling` ve `redScaling`: early/mid/late skor + aÃ§Ä±klama
- `keyMatchups[]`: kritik 1v1 veya lane eÅŸleÅŸmeleri (maks 3)
- `risks[]`: her iki takÄ±m iÃ§in zayÄ±flÄ±klar
- `verdict`: tarafsÄ±z sonuÃ§ cÃ¼mlesi

### Zod Schema

`draftAnalysisSchema` â€” `draft.types.ts` iÃ§ine ekle. `TeamComposition` iÃ§in 5 metriÄŸin 1-10 arasÄ± olduÄŸunu enforce et.

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-037 (AiCache)
- TASK-061 (Draft domain tipleri)
