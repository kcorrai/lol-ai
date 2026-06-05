# TASK-062 — [F2-2] draftAnalysisService + draftPrompt

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1 day

---

## Objective

Draft Analyzer'ın iş mantığını yaz. 10 champion'lı iki takım girişi alarak takım kompozisyon güçleri, win conditions, scaling ve risk analizi üret.

---

## Acceptance Criteria

- [ ] `src/domains/draft/services/draftAnalysisService.ts` yazıldı
- [ ] `analyzeDraft(input)` tüm 10 pozisyonun dolu olduğunu validate ediyor
- [ ] Duplicate champion kontrolü yapılıyor
- [ ] Cache hit durumunda AI çağrılmıyor (TTL: 7 gün)
- [ ] AI çıktısı Zod ile validate ediliyor
- [ ] `src/domains/draft/prompts/draftPrompt.ts` yazıldı
- [ ] Prompt takım kompozisyon skorlarını 1-10 sayısal olarak talep ediyor
- [ ] `draftAnalysisService.ts` 250 satırı geçmiyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

### Servis (`draftAnalysisService.ts`)

```typescript
export async function analyzeDraft(input: DraftInput): Promise<DraftAnalysis>
```

Validation:
```typescript
const positions: Position[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
// Her iki takımda tüm pozisyonlar dolu olmalı
// Tüm 10 champion unique olmalı (set check)
```

Cache key:
```typescript
const allChampions = [
  ...positions.map(p => input.blueTeam[p].toLowerCase()),
  ...positions.map(p => input.redTeam[p].toLowerCase()),
].sort();
buildCacheKey('draft', { champions: allChampions.join(',') })
```

TTL: 7 gün (draft meta daha hızlı değişir).

### Prompt (`draftPrompt.ts`)

`buildDraftUserPrompt(blueTeam, redTeam)`:

Pozisyon bazlı iki takımı listele, ardından şunları iste:
- `blueTeamComposition` ve `redTeamComposition`: 5 metrik 1-10 arası + summary
- `blueWinConditions[]` ve `redWinConditions[]`: primary + secondary, nasıl elde edilir
- `blueScaling` ve `redScaling`: early/mid/late skor + açıklama
- `keyMatchups[]`: kritik 1v1 veya lane eşleşmeleri (maks 3)
- `risks[]`: her iki takım için zayıflıklar
- `verdict`: tarafsız sonuç cümlesi

### Zod Schema

`draftAnalysisSchema` — `draft.types.ts` içine ekle. `TeamComposition` için 5 metriğin 1-10 arası olduğunu enforce et.

---

## Bağımlılıklar

- TASK-037 (AiCache)
- TASK-061 (Draft domain tipleri)
