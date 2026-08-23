# TASK-046 â€” [F1-2] matchupAnalysisService + matchupPrompt

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 1 day

---

## Objective

Matchup Coach'un iÅŸ mantÄ±ÄŸÄ±nÄ± yaz. Ä°ki champion + rol giriÅŸi alarak kapsamlÄ± lane analizi, trade rehberi, build tavsiyesi ve kritik hata uyarÄ±larÄ± Ã¼ret.

---

## Acceptance Criteria

- [ ] `src/domains/matchup/services/matchupAnalysisService.ts` yazÄ±ldÄ±
- [ ] `getMatchupAnalysis(champion, opponent, role)` cache hit durumunda AI Ã§aÄŸÄ±rmÄ±yor
- [ ] AynÄ± champion iki kez girilirse hata fÄ±rlatÄ±yor
- [ ] AI Ã§Ä±ktÄ±sÄ± Zod schema ile validate ediliyor
- [ ] `src/domains/matchup/prompts/matchupPrompt.ts` yazÄ±ldÄ±
- [ ] Prompt dÃ¶rt ana bÃ¶lÃ¼mÃ¼ aÃ§Ä±kÃ§a istiyor: lane analizi, trade rehberi, build, hatalar
- [ ] `matchupAnalysisService.ts` 250 satÄ±rÄ± geÃ§miyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

### Servis (`matchupAnalysisService.ts`)

```typescript
export async function getMatchupAnalysis(
  champion: string,
  opponent: string,
  role: Position
): Promise<MatchupAnalysis>;
```

Cache key:

```typescript
// "yasuo vs zed mid" ile "zed vs yasuo mid" farklÄ± â€” her iki yÃ¶n ayrÄ± analiz
buildCacheKey("matchup", {
  champion: champion.toLowerCase(),
  opponent: opponent.toLowerCase(),
  role,
});
```

TTL: 14 gÃ¼n.

AynÄ± champion guard:

```typescript
if (champion.toLowerCase() === opponent.toLowerCase()) {
  throw new Error("Ä°ki farklÄ± ÅŸampiyon seÃ§ilmelidir");
}
```

### Prompt (`matchupPrompt.ts`)

`buildMatchupUserPrompt(champion, opponent, role)`:

DÃ¶rt bÃ¶lÃ¼m iÃ§in explicit JSON anahtarlarÄ± iste:

- `laneAnalysis`: `advantage`, `summary`, `levels1to3`, `level6Plan`, `powerSpikes[]`
- `tradeGuide`: `shortTrade`, `longTrade`, `winConditions[]`, `loseConditions[]`
- `buildAdvice`: `startingItems[]`, `coreItems[]`, `situationalItems[]`, `reasoning`
- `criticalMistakes`: `avoidTrades[]`, `riskyTimings[]`, `keyMistakes[]`

### Zod Schema

`matchup.types.ts` dosyasÄ±na ekle:

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

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-037 (AiCache)
- TASK-045 (Matchup domain tipleri)
