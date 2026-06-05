# TASK-046 — [F1-2] matchupAnalysisService + matchupPrompt

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1 day

---

## Objective

Matchup Coach'un iş mantığını yaz. İki champion + rol girişi alarak kapsamlı lane analizi, trade rehberi, build tavsiyesi ve kritik hata uyarıları üret.

---

## Acceptance Criteria

- [ ] `src/domains/matchup/services/matchupAnalysisService.ts` yazıldı
- [ ] `getMatchupAnalysis(champion, opponent, role)` cache hit durumunda AI çağırmıyor
- [ ] Aynı champion iki kez girilirse hata fırlatıyor
- [ ] AI çıktısı Zod schema ile validate ediliyor
- [ ] `src/domains/matchup/prompts/matchupPrompt.ts` yazıldı
- [ ] Prompt dört ana bölümü açıkça istiyor: lane analizi, trade rehberi, build, hatalar
- [ ] `matchupAnalysisService.ts` 250 satırı geçmiyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

### Servis (`matchupAnalysisService.ts`)

```typescript
export async function getMatchupAnalysis(
  champion: string,
  opponent: string,
  role: Position
): Promise<MatchupAnalysis>
```

Cache key:
```typescript
// "yasuo vs zed mid" ile "zed vs yasuo mid" farklı — her iki yön ayrı analiz
buildCacheKey('matchup', {
  champion: champion.toLowerCase(),
  opponent: opponent.toLowerCase(),
  role,
})
```

TTL: 14 gün.

Aynı champion guard:
```typescript
if (champion.toLowerCase() === opponent.toLowerCase()) {
  throw new Error('İki farklı şampiyon seçilmelidir');
}
```

### Prompt (`matchupPrompt.ts`)

`buildMatchupUserPrompt(champion, opponent, role)`:

Dört bölüm için explicit JSON anahtarları iste:
- `laneAnalysis`: `advantage`, `summary`, `levels1to3`, `level6Plan`, `powerSpikes[]`
- `tradeGuide`: `shortTrade`, `longTrade`, `winConditions[]`, `loseConditions[]`
- `buildAdvice`: `startingItems[]`, `coreItems[]`, `situationalItems[]`, `reasoning`
- `criticalMistakes`: `avoidTrades[]`, `riskyTimings[]`, `keyMistakes[]`

### Zod Schema

`matchup.types.ts` dosyasına ekle:

```typescript
export const matchupAnalysisSchema = z.object({
  champion: z.string(),
  opponent: z.string(),
  role: z.nativeEnum(Position),
  laneAnalysis: z.object({ ... }),
  tradeGuide: z.object({ ... }),
  buildAdvice: z.object({ ... }),
  criticalMistakes: z.object({ ... }),
  generatedAt: z.string(),
  patchNote: z.string(),
});
```

---

## Bağımlılıklar

- TASK-037 (AiCache)
- TASK-045 (Matchup domain tipleri)
